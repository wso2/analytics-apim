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
package org.wso2.analytics.apim.rest.api.proxy.impl;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import feign.gson.GsonDecoder;
import org.wso2.analytics.apim.rest.api.proxy.APIMServiceStubs;
import org.wso2.analytics.apim.rest.api.proxy.ApimApiService;
import org.wso2.analytics.apim.rest.api.proxy.NotFoundException;
import org.wso2.analytics.apim.rest.api.proxy.dto.APIListDTO;
import org.wso2.analytics.apim.rest.api.proxy.dto.ApplicationListDTO;
import org.wso2.analytics.apim.rest.api.proxy.internal.ServiceHolder;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.msf4j.Request;

import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import javax.ws.rs.core.Response;

/**
 * Proxy service for APIM REST APIs
 */
public class ApimApiServiceImpl extends ApimApiService {
    private static final String DASHBOARD_USER = "DASHBOARD_USER=";
    private static final String AM_COOKIE_P1 = "SDID";
    private static final String AM_COOKIE_P2 = "HID=";
    private static final String ENDPOINT = "{serverUrl}/api/am/{serverName}/v1.0";
    private static final String PUBLISHER = "publisher";
    private static final String STORE = "store";

    /**
     * Retrieve the list of APIs from APIM Publisher
     *
     * @param request request to retrieve APIs list
     * @return list of APIs
     * @throws NotFoundException if the requested resource is not found
     */
    @Override
    public Response apimApisGet(Request request) throws NotFoundException {
        try {
            String publisherUrl = getServerURL(PUBLISHER);

            if (publisherUrl != null) {
                String publisherEndpoint = ENDPOINT.replace("{serverUrl}", publisherUrl)
                        .replace("{serverName}", PUBLISHER);
                APIMServiceStubs serviceStubs = new APIMServiceStubs(publisherEndpoint, null);
                String authToken = getAccessToken(request.getHeader("Cookie"));
                feign.Response response = serviceStubs.getPublisherServiceStub().getApis(authToken);
                APIListDTO apisDetails = (APIListDTO) new GsonDecoder().decode(response, APIListDTO.class);

                if (response.status() == 401) {
                    return Response.status(response.status()).entity("Unauthorized user").build();
                }
                return Response.status(response.status()).entity(apisDetails).build();
            } else {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Unable to find Publisher server URL.").build();
            }
        } catch (ConfigurationException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while retrieving Publisher server URL: " + e.getMessage()).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while processing server response: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Retrieve the list of applications from APIM Store
     *
     * @param request request to retrieve applications list
     * @return the list of applications
     * @throws NotFoundException if the requested resource is not found
     */
    @Override
    public Response apimApplicationsGet(Request request) throws NotFoundException {
        try {
            String storeUrl = getServerURL(STORE);

            if (storeUrl != null) {
                String storeEndpoint = ENDPOINT.replace("{serverUrl}", storeUrl)
                        .replace("{serverName}", STORE);
                APIMServiceStubs serviceStubs = new APIMServiceStubs(null, storeEndpoint);
                String authToken = getAccessToken(request.getHeader("Cookie"));
                feign.Response response = serviceStubs.getStoreServiceStub().getApplications(authToken);
                ApplicationListDTO appDetails =
                        (ApplicationListDTO) new GsonDecoder().decode(response, ApplicationListDTO.class);

                if (response.status() == 401) {
                    return Response.status(response.status()).entity("Unauthorized user").build();
                }
                return Response.status(response.status()).entity(appDetails).build();
            } else {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Unable to find Developer Prtal server URL.").build();
            }
        } catch (ConfigurationException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while retrieving Publisher server URL: " + e.getMessage()).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error occurred while processing server response: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Retrieve the server url from the deployment file
     *
     * @param serverName the name of the server, i.e. Publisher/Store
     * @return server URL of the requested endpoint
     * @throws ConfigurationException if an error occurs while retrieving configuration
     */
    private String getServerURL(String serverName) throws ConfigurationException {
        ConfigProvider configProvider = ServiceHolder.getInstance().getConfigProvider();
        LinkedHashMap authConfig = (LinkedHashMap) configProvider.getConfigurationObject("auth.configs");

        if (authConfig != null) {
            LinkedHashMap properties = (LinkedHashMap) authConfig.get("properties");
            if (properties != null) {
                if (serverName.equalsIgnoreCase(PUBLISHER)) {
                    return (String) properties.get("publisherUrl");
                } else {
                    if (properties.get("storeUrl") != null) {
                        return (String) properties.get("storeUrl");
                    } else {
                        return (String) properties.get("publisherUrl");
                    }
                }
            }
        }
        return null;
    }

    /**
     * Construct the access token from cookies
     *
     * @param cookies cookies string received with the request
     * @return the access token
     */
    private String getAccessToken(String cookies) {
        List<String> cookieList = Arrays.asList(cookies.split(";"));
        String accessTokenP1 = "";
        String accessTokenP2 = "";

        for (String cookie : cookieList) {
            if (cookie.contains(DASHBOARD_USER)) {
                String userDTO = cookie.replace(DASHBOARD_USER, "");
                JsonObject jsonUserDto = new Gson().fromJson(userDTO, JsonObject.class);
                JsonElement element = jsonUserDto.get(AM_COOKIE_P1);
                if (element != null) {
                    accessTokenP1 = element.getAsString();
                }
            } else if (cookie.contains(AM_COOKIE_P2)) {
                accessTokenP2 = cookie.replace(AM_COOKIE_P2, "");
            }
        }

        return accessTokenP1 + accessTokenP2;
    }

}
