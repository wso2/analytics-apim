package org.wso2.carbon.analytics.apim.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
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

public class ExecutionManagerInitializer {
    public static final String SPARK_SCRIPT_REGISTRY_PATH = "/repository/components/org.wso2.carbon.analytics.spark";
    public static final String TEMPLATE_CONFIGS_REGISTRY_PATH = "/repository/components/org.wso2.carbon.event.execution.manager.core/template-config/APIMAnalytics";

    private static final Log log = LogFactory.getLog(ExecutionManagerInitializer.class);

    public static void addTemplateConfigs() {
        String templateConfigDir = CarbonUtils.getCarbonHome() + File.separator + "repository" + File.separator +
                "resources" + File.separator + "execution-manager" + File.separator + "templateconfigs";
        addInitialConfigs(templateConfigDir, ".xml", ExecutionManagerInitializer.TEMPLATE_CONFIGS_REGISTRY_PATH);
    }

    public static void addSparkConfigs() {
        String sparkConfigDir = CarbonUtils.getCarbonHome() + File.separator + "repository" + File.separator +
                "resources" + File.separator + "execution-manager" + File.separator + "sparktemplates";
        addInitialConfigs(sparkConfigDir, ".xml", ExecutionManagerInitializer.SPARK_SCRIPT_REGISTRY_PATH);

    }

    private static void addInitialConfigs(String srcConfigDir, final String srcFileExtension, String registryDestCollectionPath) {

        File file = new File(srcConfigDir);
        //create a FilenameFilter
        FilenameFilter filenameFilter = new FilenameFilter() {
            public boolean accept(File dir, String name) {
                //if the file extension is .rxt return true, else false
                return name.endsWith(srcFileExtension);
            }
        };
        String[] initialConfigPaths = file.list(filenameFilter);

        if (initialConfigPaths == null || initialConfigPaths.length == 0) {
            log.info("No configurations Found.");
            return;
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
                    // to avoid overwriting user-modified files.
                    return;
                }
                String configContent = FileUtil.readFileToString(srcConfigDir + File.separator + configPath);
                Resource resource = configRegistry.newResource();
                resource.setContent(configContent.getBytes(Charset.defaultCharset()));
//                resource.setMediaType(APIConstants.RXT_MEDIA_TYPE);
                configRegistry.put(resourcePath, resource);
            } catch (IOException e) {
                String msg = "Failed to read rxt files";
                log.error(msg, e);
            } catch (RegistryException e) {
                String msg = "Failed to add rxt to registry ";
                log.error(msg, e);
            }
        }


    }


}
