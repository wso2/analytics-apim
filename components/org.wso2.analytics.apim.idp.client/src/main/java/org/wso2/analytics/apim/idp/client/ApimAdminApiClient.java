package org.wso2.analytics.apim.idp.client;

import feign.Headers;
import feign.Param;
import feign.RequestLine;
import feign.Response;

/**
 *  Feign client interface to get custom url info.
 */
public interface ApimAdminApiClient {

    @RequestLine("GET /{tenantDomain}")
    @Headers("Content-Type: application/json")
    Response getCustomUrlInfo(@Param("tenantDomain") String tenantDomain);
}
