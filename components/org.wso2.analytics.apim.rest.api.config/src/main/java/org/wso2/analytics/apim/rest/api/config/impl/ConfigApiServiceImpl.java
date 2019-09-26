package org.wso2.analytics.apim.rest.api.config.impl;

import org.wso2.analytics.apim.rest.api.config.ApiResponseMessage;
import org.wso2.analytics.apim.rest.api.config.ConfigApiService;
import org.wso2.analytics.apim.rest.api.config.NotFoundException;
import org.wso2.analytics.apim.rest.api.config.internal.ServiceHolder;

import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.msf4j.Request;
import java.util.LinkedHashMap;
import javax.ws.rs.core.Response;

/**
 *  Service Implementation class for retrieving the Server URL from custom authorization configuration
 */
public class ConfigApiServiceImpl extends ConfigApiService {

    /**
     * Retrieve the Server URL from custom authorization configuration
     *
     * @param request               request to retrieve the server URL
     * @return                      the server URL if provided, else return null.
     * @throws NotFoundException    if the API resource is not Found
     */
    @Override
    public Response configGetServerURLGet(Request request) throws NotFoundException {
        ConfigProvider configProvider = ServiceHolder.getInstance().getConfigProvider();
        String serverURL = null;

        try {
            LinkedHashMap authConfig = (LinkedHashMap) configProvider.getConfigurationObject("auth.configs");
            if (authConfig != null) {
                LinkedHashMap properties = (LinkedHashMap) authConfig.get("properties");

                if (properties != null) {
                    serverURL = (String) properties.get("adminServiceBaseUrl");
                }
            }
        } catch (ConfigurationException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while retrieving server URL: " + e.getMessage()).build();
        }
        
        return Response.ok().entity(new ApiResponseMessage(ApiResponseMessage.OK, serverURL)).build();
    }
}
