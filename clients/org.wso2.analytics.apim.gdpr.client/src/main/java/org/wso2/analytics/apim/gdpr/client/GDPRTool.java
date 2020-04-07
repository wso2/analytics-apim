/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.gdpr.client;


import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Options;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.gdpr.client.bean.GDPRClientConfiguration;
import org.wso2.analytics.apim.gdpr.client.bean.User;
import org.wso2.analytics.apim.gdpr.client.exceptions.CommandLineException;
import org.wso2.analytics.apim.gdpr.client.exceptions.GDPRClientException;
import org.wso2.analytics.apim.gdpr.client.internal.util.ClientUtils;
import org.wso2.carbon.config.ConfigProviderFactory;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.datasource.core.DataSourceManager;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.datasource.core.beans.DataSourceMetadata;
import org.wso2.carbon.datasource.core.beans.DataSourcesConfiguration;
import org.wso2.carbon.datasource.core.exception.DataSourceException;
import org.wso2.carbon.datasource.core.impl.DataSourceServiceImpl;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_CONFIG_TENANT_DOMAIN;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_CONFIG_USER_EMAIL;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_CONFIG_USER_IP;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_CONFIG_USER_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_CONFIG_USER_PSEUDONYM;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_ENABLE_SHA256_HASHING;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CMD_OPTION_HELP;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.COMMAND_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CONF_FOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.FILE_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.HELP_FILE_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_MAX;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_MIN;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.LIB_FOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.SUPER_TENANT_DOMAIN;

/**
 * Processes the GDPR client request from the external user.
 */
public class GDPRTool {

    private static final Logger LOG = LoggerFactory.getLogger(GDPRTool.class);

    public static void main(String[] args) throws Exception {
        Options options = new Options();
        options.addOption(CMD_OPTION_CONFIG_USER_NAME, true, "User Name (mandatory)");
        options.addOption(CMD_OPTION_CONFIG_USER_PSEUDONYM, true,
                "Pseudonym, which the user name to be replaced with (optional)");
        options.addOption(CMD_OPTION_CONFIG_TENANT_DOMAIN,
                true, "Tenant Domain (optional, default: " + SUPER_TENANT_DOMAIN + ")");
        options.addOption(CMD_OPTION_CONFIG_USER_EMAIL, true, "User Email (optional)");
        options.addOption(CMD_OPTION_CONFIG_USER_IP, true, "User IP Address (optional)");
        options.addOption(CMD_OPTION_HELP, false, "Help");
        options.addOption(CMD_OPTION_ENABLE_SHA256_HASHING, false,
                "Enable SHA256 hashing for anonymizing the ID attribute (optional)");

        String homeDirPath;
        try {
            homeDirPath = Paths.get(System.getProperty("user.dir")).getParent().toString();
        } catch (NullPointerException e) {
            throw new GDPRClientException("Error occurred while getting the parent directory of the current " +
                    "directory.");
        }

        String libFilePath = homeDirPath + File.separator + LIB_FOLDER;
        addJarFileUrls(new File(libFilePath));

        CommandLineParser parser = new DefaultParser();
        CommandLine cmd = parser.parse(options, args);

        if (cmd.hasOption(CMD_OPTION_HELP)) {
            emitHelp();
            return;
        }

        User user;
        if (cmd.hasOption(CMD_OPTION_CONFIG_USER_NAME)) {
            try {
                user = createUser(cmd);
            } catch (CommandLineException e) {
                LOG.error(e.getMessage());
                printError(options);
                return;
            }
        } else {
            printError(options);
            return;
        }
        GDPRTool tool = new GDPRTool();
        tool.process(homeDirPath, user);
    }

    /**
     * Writes the help content to the output stream.
     *
     */
    private static void emitHelp() {
        ByteBuffer buffer = ByteBuffer.allocateDirect(512);
        try (InputStream inputStream = GDPRTool.class.getClassLoader().getResourceAsStream(HELP_FILE_NAME);
              ReadableByteChannel readableByteChannel = Channels.newChannel(inputStream);
              WritableByteChannel writableByteChannel = Channels.newChannel(System.out)) {
            while (readableByteChannel.read(buffer) != -1) {
                buffer.flip();
                while (buffer.hasRemaining()) {
                    writableByteChannel.write(buffer);
                }
                buffer.clear();
            }
        } catch (IOException e) {
            LOG.error("Could not read the help file.");
        }
    }

    private static String createPseudonym(CommandLine cmd) {
        String pseudonym = cmd.getOptionValue(CMD_OPTION_CONFIG_USER_PSEUDONYM);
        if (StringUtils.isEmpty(pseudonym) && cmd.hasOption(CMD_OPTION_ENABLE_SHA256_HASHING)) {
            String userName = cmd.getOptionValue(CMD_OPTION_CONFIG_USER_NAME);
            pseudonym = DigestUtils.sha256Hex(userName);
            LOG.info("Generated SHA256 hash for the given ID attribute : " + pseudonym);
        } else if (StringUtils.isEmpty(pseudonym)) {
            pseudonym = UUID.randomUUID().toString();
            LOG.info("Generating pseudonym as pseudonym is not provided : " + pseudonym);
        }
        return pseudonym;
    }

    private static void printError(Options options) {
        HelpFormatter formatter = new HelpFormatter();
        formatter.printHelp(COMMAND_NAME, options);
    }

    public void process(String homePath, User user) {
        String configFilePath = homePath + File.separator + CONF_FOLDER;
        Path deploymentConfigPath = Paths.get(configFilePath, FILE_NAME);
        ConfigProvider configProvider;
        try {
            configProvider = ConfigProviderFactory.getConfigProvider(deploymentConfigPath);
            GDPRClientConfiguration gdprClientConfiguration
                    = configProvider.getConfigurationObject(GDPRClientConfiguration.class);
            DataSourcesConfiguration dataSourcesConfiguration
                    = configProvider.getConfigurationObject(DataSourcesConfiguration.class);
            List<DataSourceMetadata> dataSources = dataSourcesConfiguration.getDataSources();

            DataSourceManager dataSourceManager = DataSourceManager.getInstance();
            DataSourceService dataSourceService = new DataSourceServiceImpl();

            // load and initialize the data sources defined in configuration file
            dataSourceManager.initDataSources(configProvider);

            Executor executor = new Executor(gdprClientConfiguration, dataSources, dataSourceService, user);
            executor.execute();
        } catch (ConfigurationException e) {
            LOG.error("Error in getting configuration", e);
        } catch (DataSourceException e) {
            LOG.error("Error occurred while initialising data sources.", e);
        } catch (GDPRClientException e) {
            LOG.error("Error occurred while updating the table entries.", e);
        }
    }

    private static User createUser(CommandLine cmd) throws CommandLineException {
        String userName = cmd.getOptionValue(CMD_OPTION_CONFIG_USER_NAME);
        String tenantName = cmd.getOptionValue(CMD_OPTION_CONFIG_TENANT_DOMAIN, SUPER_TENANT_DOMAIN);
        String userEmail = cmd.getOptionValue(CMD_OPTION_CONFIG_USER_EMAIL);
        String userIP = cmd.getOptionValue(CMD_OPTION_CONFIG_USER_IP);
        String pseudonym = createPseudonym(cmd);
        String ipPseudonym = ClientUtils.generateRandomIP(IP_MIN, IP_MAX);

        // validate user provided user ip address
        if (!StringUtils.isEmpty(userIP) && ClientUtils.isIPValid(userIP)) {
            throw new CommandLineException("Provided user IP address is invalid: " + userIP);
        }

        User user = new User();
        user.setUsername(userName);
        user.setTenantDomain(tenantName);
        user.setPseudonym(pseudonym);
        user.setUserEmail(userEmail);
        user.setUserIP(userIP);
        user.setIpPseudonym(ipPseudonym);
        return user;
    }

    /**
     * Add JAR files found in the given directory to the Classpath. This fix is done due to terminal's argument
     * character limitation.
     *
     * @param root the directory to recursively search for JAR files.
     * @throws java.net.MalformedURLException If a provided JAR file URL is malformed
     */
    private static void addJarFileUrls(File root) throws Exception {
        File[] children = root.listFiles();
        if (children == null) {
            return;
        }
        for (File child : children) {
            if (child.isFile() && child.canRead() && !child.getName().contains("slf4j")
                    && child.getName().toLowerCase(Locale.ENGLISH).endsWith(".jar")) {
                addPath(child.getPath());
            }
        }
    }

    private static void addPath(String s) throws Exception {
        File f = new File(s);
        URL u = f.toURI().toURL();
        URLClassLoader urlClassLoader = (URLClassLoader) ClassLoader.getSystemClassLoader();
        Class<URLClassLoader> urlClass = URLClassLoader.class;
        Method method = urlClass.getDeclaredMethod("addURL", URL.class);
        method.setAccessible(true);
        method.invoke(urlClassLoader, u);
    }
}
