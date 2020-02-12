/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.idp.client;

import org.wso2.analytics.apim.idp.client.dao.OAuthAppDAO;
import org.wso2.carbon.analytics.idp.client.external.impl.DCRMServiceStub;
import org.wso2.carbon.analytics.idp.client.external.impl.OAuth2ServiceStubs;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;

import java.util.Map;

/**
 *  Builder class for ApimIdpClient
 */
public class ApimIdPClientBuilder {

    private String adminServiceUsername;
    private String baseUrl;
    private OAuthAppDAO oAuthAppDAO;
    private String authorizeEndpoint;
    private String grantType;
    private String adminScopeName;
    private String allScopes;
    private Map<String, OAuthApplicationInfo> oAuthAppInfoMap;
    private int cacheTimeout;
    private String kmUserName;
    private DCRMServiceStub dcrmServiceStub;
    private OAuth2ServiceStubs oAuth2ServiceStubs;
    private boolean isSSOEnabled;
    private String ssoLogoutURL;
    private boolean isHostnameVerifierEnabled;
    private ApimAdminApiClient apimAdminApiClient;
    private String portalAppContext;

    public ApimIdPClientBuilder setAdminServiceUsername(String adminServiceUsername) {

        this.adminServiceUsername = adminServiceUsername;
        return this;
    }

    public ApimIdPClientBuilder setBaseUrl(String baseUrl) {

        this.baseUrl = baseUrl;
        return this;
    }

    public ApimIdPClientBuilder setoAuthAppDAO(OAuthAppDAO oAuthAppDAO) {

        this.oAuthAppDAO = oAuthAppDAO;
        return this;
    }

    public ApimIdPClientBuilder setAuthorizeEndpoint(String authorizeEndpoint) {

        this.authorizeEndpoint = authorizeEndpoint;
        return this;
    }

    public ApimIdPClientBuilder setGrantType(String grantType) {

        this.grantType = grantType;
        return this;
    }

    public ApimIdPClientBuilder setAdminScopeName(String adminScopeName) {

        this.adminScopeName = adminScopeName;
        return this;
    }

    public ApimIdPClientBuilder setAllScopes(String allScopes) {

        this.allScopes = allScopes;
        return this;
    }

    public ApimIdPClientBuilder setoAuthAppInfoMap(Map<String, OAuthApplicationInfo> oAuthAppInfoMap) {

        this.oAuthAppInfoMap = oAuthAppInfoMap;
        return this;
    }

    public ApimIdPClientBuilder setCacheTimeout(int cacheTimeout) {

        this.cacheTimeout = cacheTimeout;
        return this;
    }

    public ApimIdPClientBuilder setKmUserName(String kmUserName) {

        this.kmUserName = kmUserName;
        return this;
    }

    public ApimIdPClientBuilder setDcrmServiceStub(DCRMServiceStub dcrmServiceStub) {

        this.dcrmServiceStub = dcrmServiceStub;
        return this;
    }

    public ApimIdPClientBuilder setoAuth2ServiceStubs(OAuth2ServiceStubs oAuth2ServiceStubs) {

        this.oAuth2ServiceStubs = oAuth2ServiceStubs;
        return this;
    }

    public ApimIdPClientBuilder setIsSSOEnabled(boolean isSSOEnabled) {

        this.isSSOEnabled = isSSOEnabled;
        return this;
    }

    public ApimIdPClientBuilder setSsoLogoutURL(String ssoLogoutURL) {

        this.ssoLogoutURL = ssoLogoutURL;
        return this;
    }

    public ApimIdPClientBuilder setIsHostnameVerifierEnabled(boolean isHostnameVerifierEnabled) {

        this.isHostnameVerifierEnabled = isHostnameVerifierEnabled;
        return this;
    }

    public ApimIdPClientBuilder setApimAdminApiClient(ApimAdminApiClient apimAdminApiClient) {

        this.apimAdminApiClient = apimAdminApiClient;
        return this;
    }

    public ApimIdPClientBuilder setPortalAppContext(String portalAppContext) {

        this.portalAppContext = portalAppContext;
        return this;
    }

    public ApimIdPClient createApimIdPClient() {

        return new ApimIdPClient(adminServiceUsername, baseUrl, oAuthAppDAO, authorizeEndpoint, grantType,
                adminScopeName, allScopes, oAuthAppInfoMap, cacheTimeout, kmUserName, dcrmServiceStub,
                oAuth2ServiceStubs, isSSOEnabled, ssoLogoutURL, isHostnameVerifierEnabled, apimAdminApiClient,
                portalAppContext);
    }
}
