package org.wso2.analytics.apim.rest.api.proxy;

import feign.Feign;
import feign.Headers;
import feign.Param;
import feign.RequestLine;
import feign.Response;
import feign.gson.GsonDecoder;
import feign.gson.GsonEncoder;
import feign.okhttp.OkHttpClient;

/**
 * This is the stub class for APIM Publisher and Store REST APIs
 */
public class APIMServiceStubs {

    private String publisherEndpoint;
    private String storeEndpoint;

    /**
     * Constructor
     *
     * @param publisherEndpoint Publisher REST API endpoint
     * @param storeEndpoint     Store REST API endpoint
     */
    public APIMServiceStubs(String publisherEndpoint, String storeEndpoint) {
        this.publisherEndpoint = publisherEndpoint;
        this.storeEndpoint = storeEndpoint;
    }

    /**
     * This interface is for APIM Publisher REST API stub
     */
    public interface PublisherServiceStub {

        @Headers("Authorization: Bearer {auth_token}")
        @RequestLine("GET /apis?offset={offset}&limit={limit}")
        Response getApis(@Param("auth_token") String authToken, @Param("offset") int offset, @Param("limit") int limit);

        /**
         * Get list of APIs
         *
         * @param authToken access token
         * @return the list of APIs
         */
        public default Response getApis(String authToken) {
            return getApis(authToken, 0, Integer.MAX_VALUE);
        }
    }

    /**
     * Create and return APIM Publisher REST API service stub
     *
     * @return Publisher REST API service stub
     */
    public APIMServiceStubs.PublisherServiceStub getPublisherServiceStub() {
        return Feign.builder()
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .client(new OkHttpClient())
                .target(APIMServiceStubs.PublisherServiceStub.class, publisherEndpoint);
    }

    /**
     * This interface is for APIM Store REST API stub
     */
    public interface StoreServiceStub {

        @Headers("Authorization: Bearer {auth_token}")
        @RequestLine("GET /applications?offset={offset}&limit={limit}")
        Response getApplications(@Param("auth_token") String authToken, @Param("offset") int offset,
                                 @Param("limit") int limit);

        /**
         * Get list of Applications
         *
         * @param authToken access token
         * @return the list of Applications
         */
        public default Response getApplications(String authToken) {
            return getApplications(authToken, 0, Integer.MAX_VALUE);
        }
    }

    /**
     * Create and return APIM Store REST API service stub
     *
     * @return Store REST API service stub
     */
    public APIMServiceStubs.StoreServiceStub getStoreServiceStub() {
        return Feign.builder()
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .client(new OkHttpClient())
                .target(APIMServiceStubs.StoreServiceStub.class, storeEndpoint);
    }
}
