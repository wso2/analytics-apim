/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.carbon.analytics.apim.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.spark.core.exception.AnalyticsPersistenceException;
import org.wso2.carbon.analytics.spark.core.internal.AnalyticsPersistenceManager;
import org.wso2.carbon.analytics.spark.core.util.AnalyticsConstants;
import org.wso2.carbon.analytics.spark.core.util.AnalyticsScript;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2.carbon.registry.core.RegistryConstants;
import org.wso2.carbon.registry.core.Resource;
import org.wso2.carbon.registry.core.exceptions.RegistryException;
import org.wso2.carbon.registry.core.service.RegistryService;
import org.wso2.carbon.registry.core.session.UserRegistry;
import org.wso2.carbon.utils.CarbonUtils;
import org.wso2.carbon.utils.FileUtil;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.nio.charset.Charset;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

/**
 * Alerting scenarios are templated hence nothing get deployed by default. Hence, we need to deploy a set of default
 * configurations. This class does that.
 */
public class TemplateManagerInitializer {
    public static final String TEMPLATE_CONFIGS_REGISTRY_PATH = "/repository/components/org.wso2.carbon.event.template.manager.core/template-config/APIMAnalytics";
    public static final String OVERWRITE_TEMPLATE_MANAGER_VAR = "overwriteTemplateManager";

    private static final Log log = LogFactory.getLog(TemplateManagerInitializer.class);

    public static void addTemplateConfigs() {
        String templateConfigDir = CarbonUtils.getCarbonHome() + File.separator + "repository" + File.separator
                + "resources" + File.separator + "template-manager" + File.separator + "templateconfigs";
        addInitialConfigs(templateConfigDir, ".xml", TemplateManagerInitializer.TEMPLATE_CONFIGS_REGISTRY_PATH);
    }

    public static void addSparkConfigs() {
        String sparkConfigDir = CarbonUtils.getCarbonHome() + File.separator + "repository" + File.separator
                + "resources" + File.separator + "template-manager" + File.separator + "sparktemplates";

        String[] initialConfigPaths = getFileNames(sparkConfigDir, ".xml");

        if (initialConfigPaths == null || initialConfigPaths.length == 0) {
            if (log.isDebugEnabled()) {
                log.debug("No Spark Templates Found.");
            }
        }
        String overwrite = System.getProperty(OVERWRITE_TEMPLATE_MANAGER_VAR);
        for (String path : initialConfigPaths) {
            deploy(sparkConfigDir + File.separator + path, "", overwrite == null ? null : overwrite.trim());
        }
    }

    private static void addInitialConfigs(String srcConfigDir, final String srcFileExtension, String registryDestCollectionPath) {

        String[] initialConfigPaths = getFileNames(srcConfigDir, srcFileExtension);

        if (initialConfigPaths == null || initialConfigPaths.length == 0) {
            if(log.isDebugEnabled()) {
                log.debug("No configurations Found.");
            }
        }

        RegistryService registryService = ServiceReferenceHolder.getRegistryService();
        UserRegistry configRegistry = null;
        try {
            configRegistry = registryService.getConfigSystemRegistry();
            //Collection directory will be created if it is not exist in the registry
            if (!configRegistry.resourceExists(registryDestCollectionPath)) {
                configRegistry.put(registryDestCollectionPath, configRegistry.newCollection());
            }

        } catch (RegistryException e) {
            log.error("Failed to get registry", e);
            return;
        }

        // adding template configs
        for (String configPath : initialConfigPaths) {
            String resourcePath = registryDestCollectionPath +
                    RegistryConstants.PATH_SEPARATOR + configPath;
            try {
                if (configRegistry.resourceExists(resourcePath)) {
                    //check template manager need to replace
                    String overwrite = System.getProperty(OVERWRITE_TEMPLATE_MANAGER_VAR);
                    if ("true".equalsIgnoreCase(overwrite.trim())) {
                        if (log.isDebugEnabled()) {
                            log.debug("TemplateManager will overwrite since it is selected!");
                        }
                    } else {
                        // to avoid overwriting user-modified files.
                        return;
                    }
                }
                String configContent = FileUtil.readFileToString(srcConfigDir + File.separator + configPath);
                Resource resource = configRegistry.newResource();
                resource.setContent(configContent.getBytes(Charset.defaultCharset()));
                configRegistry.put(resourcePath, resource);
            } catch (IOException e) {
                String msg = "Failed to read template file: "+configPath;
                log.error(msg, e);
            } catch (RegistryException e) {
                String msg = String.format("Failed to add template [ %s ] to registry.", configPath);
                log.error(msg, e);
            }
        }
    }

    private static String[] getFileNames(String srcConfigDir, final String srcFileExtension) {
        File file = new File(srcConfigDir);
        //create a FilenameFilter
        FilenameFilter filenameFilter = new FilenameFilter() {
            public boolean accept(File dir, String name) {
                //if the file extension is .rxt return true, else false
                return name.endsWith(srcFileExtension);
            }
        };
        return file.list(filenameFilter);
    }

    private static void deploy(String scriptFilePath, String carbonAppName, String shouldOverwrite) {
        File deploymentFileData = new File(scriptFilePath);
        try {
            int tenantId = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId();
            if (log.isDebugEnabled()) {
                log.debug("Deploying default templated spark script: " + deploymentFileData.getName() + " for tenant : "
                        + tenantId);
            }
            JAXBContext context = JAXBContext.newInstance(AnalyticsScript.class);
            Unmarshaller un = context.createUnmarshaller();
            AnalyticsScript script = (AnalyticsScript) un.unmarshal(deploymentFileData);
            script.setName(getScriptName(deploymentFileData.getName()));
            if (Boolean.parseBoolean(shouldOverwrite)) {
                AnalyticsPersistenceManager.getInstance().putScript(tenantId, script.getName(),
                        script.getScriptContent(), script.getCronExpression(), carbonAppName, false);
            } else {
                try {
                    AnalyticsPersistenceManager.getInstance().saveScript(tenantId, script.getName(),
                            script.getScriptContent(), script.getCronExpression(), carbonAppName, false);
                } catch (AnalyticsPersistenceException ignore) {
                    // if overwrite=false, we ignore the deployment. This exception means, there's a script with the
                    // same name which was deployed via template manager UI.
                }
            }
        } catch (JAXBException e) {
            String errorMsg = "Error while reading the analytics script : " + deploymentFileData.getAbsolutePath();
            log.error(errorMsg, e);
        } catch (AnalyticsPersistenceException e) {
            String errorMsg = "Error while storing the script : " + deploymentFileData.getAbsolutePath();
            log.error(errorMsg);
        }
    }

    private static String getScriptName(String filePath) throws AnalyticsPersistenceException {
        String fileName = new File(filePath).getName();
        if (fileName.endsWith(AnalyticsConstants.SCRIPT_EXTENSION)) {
            return fileName.substring(0, fileName.length() - (AnalyticsConstants.SCRIPT_EXTENSION.length() +
                    AnalyticsConstants.SCRIPT_EXTENSION_SEPARATOR.length()));
        }
        return fileName;
    }

}
