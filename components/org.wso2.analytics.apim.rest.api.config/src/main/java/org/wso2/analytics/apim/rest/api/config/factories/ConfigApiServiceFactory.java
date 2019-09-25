package org.wso2.analytics.apim.rest.api.config.factories;

import org.wso2.analytics.apim.rest.api.config.ConfigApiService;
import org.wso2.analytics.apim.rest.api.config.impl.ConfigApiServiceImpl;

/**
 * Factory class for ConfigApiService object
 */
public class ConfigApiServiceFactory {
    private static final ConfigApiService service = new ConfigApiServiceImpl();

    public static ConfigApiService getConfigApi() {
        return service;
    }
}
