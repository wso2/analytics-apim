/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.wso2.analytics.apim.rest.api.config.impl;

import org.wso2.analytics.apim.rest.api.config.ConfigApiService;
import org.wso2.analytics.apim.rest.api.config.NotFoundException;
import org.wso2.analytics.apim.rest.api.config.dto.ServerUrlListDTO;
import org.wso2.analytics.apim.rest.api.config.internal.ServiceHolder;

import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.msf4j.Request;
import java.util.LinkedHashMap;
import javax.ws.rs.core.Response;

/**
 *  Service Implementation class for retrieving the Publisher and Store Server URLs from custom authorization
 *  configuration
 */
public class ConfigApiServiceImpl extends ConfigApiService {

    /**
     * Retrieve the Publisher and Store Server URLs from custom authorization configuration
     *
     * @param request               request to retrieve the server URL
     * @return                      the Publisher and Store server URLs if provided
     * @throws NotFoundException    if the API resource is not Found
     */
    @Override
    public Response configGetServerUrlsGet(Request request) throws NotFoundException {
        ConfigProvider configProvider = ServiceHolder.getInstance().getConfigProvider();
        ServerUrlListDTO serverURLs = new ServerUrlListDTO();

        try {
            LinkedHashMap authConfig = (LinkedHashMap) configProvider.getConfigurationObject("auth.configs");

            if (authConfig != null) {
                LinkedHashMap properties = (LinkedHashMap) authConfig.get("properties");
                if (properties != null) {
                    serverURLs.setPublisherUrl((String) properties.get("publisherUrl"));
                    if (properties.get("storeUrl") != null) {
                        serverURLs.setStoreUrl((String) properties.get("storeUrl"));
                    } else {
                        serverURLs.setStoreUrl((String) properties.get("publisherUrl"));
                    }
                }
            }
        } catch (ConfigurationException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while retrieving server URL: " + e.getMessage()).build();
        }

        return Response.ok().entity(serverURLs).build();
    }
}
