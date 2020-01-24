/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
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

/**
 * External IdP Client Constants.
 */
public class ApimIdPClientConstants {

    public static final String EXTERNAL_IDP_CLIENT_TYPE = "apim";

    public static final String ADMIN_USERNAME = "adminUsername";
    public static final String ADMIN_SCOPE = "adminScope";
    public static final String ALL_SCOPES = "allScopes";
    public static final String BASE_URL = "baseUrl";
    public static final String GRANT_TYPE = "grantType";
    public static final String KM_TOKEN_URL = "kmTokenUrl";
    public static final String KM_TOKEN_URL_FOR_REDIRECTION = "kmTokenUrlForRedirection";
    public static final String KM_DCR_URL = "kmDcrUrl";
    public static final String KM_USERNAME = "kmUsername";
    public static final String KM_PASSWORD = "kmPassword";
    public static final String PORTAL_APP_CONTEXT = "portalAppContext";
    public static final String BR_DB_APP_CONTEXT = "businessRulesAppContext";
    public static final String SP_CLIENT_ID = "spClientId";
    public static final String PORTAL_CLIENT_ID = "portalClientId";
    public static final String BR_DB_CLIENT_ID = "businessRulesClientId";
    public static final String SP_CLIENT_SECRET = "spClientSecret";
    public static final String PORTAL_CLIENT_SECRET = "portalClientSecret";
    public static final String BR_DB_CLIENT_SECRET = "businessRulesClientSecret";
    public static final String CACHE_TIMEOUT = "cacheTimeout";
    public static final String DATABASE_NAME = "databaseName";
    public static final String DCR_APP_OWNER = "dcrAppOwner";
    public static final String CONNECTION_TIMEOUT = "connectionTimeout";
    public static final String READ_TIMEOUT = "readTimeout";
    public static final String EXTERNAL_SSO_LOGOUT_URL = "externalLogoutUrl";

    public static final String DEFAULT_ADMIN_SERVICE_USERNAME = "admin";
    public static final String DEFAULT_ADMIN_SCOPE = "apim_analytics:admin_carbon.super";
    public static final String DEFAULT_ALL_SCOPES = "apim_analytics:admin apim_analytics:product_manager " +
            "apim_analytics:api_developer apim_analytics:app_developer apim_analytics:devops_engineer " +
            "apim_analytics:analytics_viewer apim_analytics:everyone";
    public static final String DEFAULT_BASE_URL = "https://localhost:9643";
    public static final String DEFAULT_KM_TOKEN_URL = "https://localhost:9443/oauth2";
    public static final String DEFAULT_KM_TOKEN_URL_FOR_REDIRECTION = "https://localhost:9443/oauth2";
    public static final String DEFAULT_KM_DCR_URL = "https://localhost:9443/client-registration/v0.15/register";
    public static final String DEFAULT_KM_USERNAME = "admin";
    public static final String DEFAULT_KM_PASSWORD = "admin";
    public static final String DEFAULT_SP_APP_CONTEXT = "sp";
    public static final String DEFAULT_PORTAL_APP_CONTEXT = "analytics-dashboard";
    public static final String DEFAULT_BR_DB_APP_CONTEXT = "business-rules";
    public static final String DEFAULT_CACHE_TIMEOUT = "900";
    public static final String DEFAULT_DATABASE_NAME = "AM_DB";
    public static final String DEFAULT_CONNECTION_TIMEOUT = "10000";
    public static final String DEFAULT_READ_TIMEOUT = "60000";
    public static final String DEFAULT_EXTERNAL_SSO_LOGOUT_URL = "https://localhost:9443/oidc/logout";
    public static final String SSO_LOGING_ID_TOKEN_TAIL = "?id_token_hint=";
    public static final String POST_LOGOUT_REDIRECT_URI_PHRASE = "&post_logout_redirect_uri=";

    public static final String REDIRECT_URL = "Redirect_Url";

    public static final String SP_APP_NAME = "sp";
    public static final String PORTAL_APP_NAME = "sp_analytics_dashboard";
    public static final String BR_DB_APP_NAME = "sp_business_rules";

    public static final String INTROSPECTION_URL = "introspectionUrl";

    public static final String CALLBACK_URL = "/login/callback/";
    public static final String CALLBACK_URL_SUFFIX = "/login";
    public static final String REGEX_BASE_START = "regexp=(";
    public static final String FORWARD_SLASH = "/";
    public static final String REGEX_BASE = "|";
    public static final String REGEX_BASE_END = ")";
    public static final String SPACE = " ";
    public static final String AT = "@";

    public static final String REVOKE_POSTFIX = "/revoke";
    public static final String TOKEN_POSTFIX = "/token";
    public static final String INTROSPECT_POSTFIX = "/introspect";
    public static final String AUTHORIZE_POSTFIX = "/authorize";

    public static final String ANY_TENANT_DOMAIN_SCOPE_POSTFIX = "_any";
    public static final String UNDERSCORE = "_";

    public static final String SUPER_TENANT_DOMAIN = "carbon.super";

    public static final String OPEN_ID_SCOPE = "openid";
    public static final String API_VIEW_SCOPE = "apim:api_view";
    public static final String SUBSCRIBE_SCOPE = "apim:subscribe";

    public static final String OAUTHAPP_TABLE = "AM_SYSTEM_APPS";
    public static final String OAUTHAPP_TABLE_CONSUMER_KEY_COLUMN = "CONSUMER_KEY";
    public static final String OAUTHAPP_TABLE_CONSUMER_SECRET_COLUMN = "CONSUMER_SECRET";
    public static final String OAUTH_APP_TABLE_CHECK = "OAUTH_APP_TABLE_CHECK";
    public static final String RETRIEVE_OAUTH_APP_TEMPLATE = "RETRIEVE_OAUTH_APP";

    private ApimIdPClientConstants() {
    }
}
