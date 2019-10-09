package org.wso2.analytics.apim.rest.api.proxy.factories;

import org.wso2.analytics.apim.rest.api.proxy.ApimApiService;
import org.wso2.analytics.apim.rest.api.proxy.impl.ApimApiServiceImpl;

/**
 * Factory class for ApimApiService
 */
public class ApimApiServiceFactory {
    private static final ApimApiService service = new ApimApiServiceImpl();

    /**
     * Get ApimApiService instance
     *
     * @return ApimApiService instance
     */
    public static ApimApiService getApimApi() {
        return service;
    }
}
