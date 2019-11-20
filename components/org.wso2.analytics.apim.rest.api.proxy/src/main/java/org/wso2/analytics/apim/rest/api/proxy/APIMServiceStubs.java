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
package org.wso2.analytics.apim.rest.api.proxy;

import feign.Client;
import feign.Feign;
import feign.Headers;
import feign.Param;
import feign.RequestLine;
import feign.Response;
import feign.gson.GsonDecoder;
import feign.gson.GsonEncoder;
import feign.okhttp.OkHttpClient;
import org.wso2.analytics.apim.rest.api.proxy.internal.ServiceHolder;
import org.wso2.carbon.kernel.config.model.CarbonConfiguration;

/**
 * This is the stub class for APIM Publisher and Store REST APIs.
 */
public class APIMServiceStubs {

    private String publisherEndpoint;
    private String storeEndpoint;


    /**
     * Get a new OkHttpClient instance.
     *
     * @return a OkHttpClient instance
     */
    public Client newOkHttpClientInstance() {
        CarbonConfiguration carbonConfiguration = ServiceHolder.getInstance().getCarbonConfiguration();
        if (!carbonConfiguration.isHostnameVerificationEnabled()) {
            return new OkHttpClient.Default(null, (hostName, sslSession) -> true);
        } else {
            return new OkHttpClient.Default(null, null);
        }
    }

    /**
     * Constructor.
     *
     * @param publisherEndpoint Publisher REST API endpoint
     * @param storeEndpoint     Store REST API endpoint
     */
    public APIMServiceStubs(String publisherEndpoint, String storeEndpoint) {
        this.publisherEndpoint = publisherEndpoint;
        this.storeEndpoint = storeEndpoint;
    }

    /**
     * This interface is for APIM Publisher REST API stub.
     */
    public interface PublisherServiceStub {

        @Headers("Authorization: Bearer {auth_token}")
        @RequestLine("GET /apis?offset={offset}&limit={limit}")
        Response getApis(@Param("auth_token") String authToken, @Param("offset") int offset, @Param("limit") int limit);

        /**
         * Get list of APIs.
         *
         * @param authToken access token
         * @return the list of APIs
         */
        public default Response getApis(String authToken) {
            return getApis(authToken, 0, Integer.MAX_VALUE);
        }
    }

    /**
     * Create and return APIM Publisher REST API service stub.
     *
     * @return Publisher REST API service stub
     */
    public APIMServiceStubs.PublisherServiceStub getPublisherServiceStub() {
        return Feign.builder()
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .client(newOkHttpClientInstance())
                .target(APIMServiceStubs.PublisherServiceStub.class, publisherEndpoint);
    }

    /**
     * This interface is for APIM Store REST API stub.
     */
    public interface StoreServiceStub {

        @Headers("Authorization: Bearer {auth_token}")
        @RequestLine("GET /applications?offset={offset}&limit={limit}")
        Response getApplications(@Param("auth_token") String authToken, @Param("offset") int offset,
                                 @Param("limit") int limit);

        /**
         * Get list of Applications.
         *
         * @param authToken access token
         * @return the list of Applications
         */
        public default Response getApplications(String authToken) {
            return getApplications(authToken, 0, Integer.MAX_VALUE);
        }
    }

    /**
     * Create and return APIM Store REST API service stub.
     *
     * @return Store REST API service stub
     */
    public APIMServiceStubs.StoreServiceStub getStoreServiceStub() {
        return Feign.builder()
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .client(newOkHttpClientInstance())
                .target(APIMServiceStubs.StoreServiceStub.class, storeEndpoint);
    }
}
