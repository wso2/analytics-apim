package org.wso2.analytics.apim.rest.api.file.factories;

import org.wso2.analytics.apim.rest.api.file.UsageApiService;
import org.wso2.analytics.apim.rest.api.file.impl.UsageApiServiceImpl;

/**
 * Factory class for UsageApiService object
 */
public class UsageApiServiceFactory {
    private static final UsageApiService service = new UsageApiServiceImpl();

    public static UsageApiService getUsageApi() {
        return service;
    }
}
