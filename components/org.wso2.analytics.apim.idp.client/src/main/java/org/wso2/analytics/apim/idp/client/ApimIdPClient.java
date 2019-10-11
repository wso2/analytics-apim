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

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.gson.Gson;
import feign.Response;
import feign.gson.GsonDecoder;
import org.apache.axis2.AxisFault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.idp.client.dto.DCRClientInfo;
import org.wso2.analytics.apim.idp.client.dto.DCRClientResponse;
import org.wso2.analytics.apim.idp.client.dto.DCRError;
import org.wso2.carbon.analytics.idp.client.core.exception.AuthenticationException;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.models.Role;
import org.wso2.carbon.analytics.idp.client.core.models.User;
import org.wso2.carbon.analytics.idp.client.core.utils.IdPClientConstants;
import org.wso2.carbon.analytics.idp.client.external.ExternalIdPClient;
import org.wso2.carbon.analytics.idp.client.external.dto.OAuth2IntrospectionResponse;
import org.wso2.carbon.analytics.idp.client.external.dto.OAuth2TokenInfo;
import org.wso2.carbon.analytics.idp.client.external.impl.DCRMServiceStub;
import org.wso2.carbon.analytics.idp.client.external.impl.OAuth2ServiceStubs;
import org.wso2.carbon.analytics.idp.client.external.models.ExternalSession;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;
import org.wso2.carbon.authenticator.stub.LoginAuthenticationExceptionException;
import org.wso2.carbon.identity.oauth.stub.OAuthAdminServiceIdentityOAuthAdminException;
import org.wso2.carbon.identity.oauth.stub.dto.OAuthConsumerAppDTO;

import java.io.IOException;
import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.FORWARD_SLASH;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.POST_LOGOUT_REDIRECT_URI_PHRASE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.REGEX_BASE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.REGEX_BASE_END;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.SPACE;

/**
 * Implementation class for Apim IdP based on OAuth2.
 */
public class ApimIdPClient extends ExternalIdPClient {

    private static final Logger LOG = LoggerFactory.getLogger(ApimIdPClient.class);

    private DCRMServiceStub dcrmServiceStub;
    private OAuth2ServiceStubs oAuth2ServiceStubs;
    private String kmUserName;
    private String authorizeEndpoint;
    private String grantType;
    private String adminServiceBaseUrl;
    private String adminServiceUsername;
    private String adminServicePassword;
    private String uriHost;
    private String baseUrl;
    private String adminScopeName;
    private String allScopes;
    private Cache<String, ExternalSession> tokenCache;
    private boolean isSSOEnabled;
    private String ssoLogoutURL;
    private OAuthAdminServiceClient oAuthAdminServiceClient;

    // Here the user given context are mapped to the OAuthApp Info.
    private Map<String, OAuthApplicationInfo> oAuthAppInfoMap;

    public ApimIdPClient(String adminServiceBaseUrl, String adminServiceUsername, String adminServicePassword,
                         String uriHost, String baseUrl, String authorizeEndpoint, String grantType,
                         String adminScopeName, String allScopes, Map<String, OAuthApplicationInfo> oAuthAppInfoMap,
                         int cacheTimeout, String kmUserName, DCRMServiceStub dcrmServiceStub,
                         OAuth2ServiceStubs oAuth2ServiceStubs, boolean isSSOEnabled, String ssoLogoutURL) {
        super(baseUrl, authorizeEndpoint, grantType, null, adminScopeName, oAuthAppInfoMap,
                cacheTimeout, null, dcrmServiceStub, oAuth2ServiceStubs, null, null, isSSOEnabled, ssoLogoutURL);
        this.adminServiceBaseUrl = adminServiceBaseUrl;
        this.adminServiceUsername = adminServiceUsername;
        this.adminServicePassword = adminServicePassword;
        this.uriHost = uriHost;
        this.baseUrl = baseUrl;
        this.authorizeEndpoint = authorizeEndpoint;
        this.grantType = grantType;
        this.oAuthAppInfoMap = oAuthAppInfoMap;
        this.adminScopeName = adminScopeName;
        this.allScopes = allScopes;
        this.kmUserName = kmUserName;
        this.dcrmServiceStub = dcrmServiceStub;
        this.oAuth2ServiceStubs = oAuth2ServiceStubs;
        this.tokenCache = CacheBuilder.newBuilder()
                .expireAfterWrite(cacheTimeout, TimeUnit.SECONDS)
                .build();
        this.isSSOEnabled = isSSOEnabled;
        this.ssoLogoutURL = ssoLogoutURL;
        this.oAuthAdminServiceClient = oAuthAdminServiceClient;
    }

    @Override
    public void init(String kmUserName) throws IdPClientException {
        /*
        * Service clients are created inside init (which is called in login method) in order to prevent error logs
        * printed when the dashboard runtime started without starting APIM server.
        * */
        LoginAdminServiceClient login;
        String session;
        try {
            login = new LoginAdminServiceClient(this.adminServiceBaseUrl);
            session = login.authenticate(this.adminServiceUsername, this.adminServicePassword, this.uriHost);
        } catch (AxisFault axisFault) {
            String error = "Error occurred while creating Login admin Service Client.";
            LOG.error(error);
            throw new IdPClientException(error, axisFault.getCause());
        } catch (RemoteException | LoginAuthenticationExceptionException e) {
            String error = "Error occurred while authenticating admin user using Login admin Service Client.";
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        try {
            this.oAuthAdminServiceClient = new OAuthAdminServiceClient(this.adminServiceBaseUrl,
                    this.adminServiceUsername, this.adminServicePassword, session);
        } catch (AxisFault axisFault) {
            String error = "Error occurred while creating OAuth Admin Service Client.";
            LOG.error(error);
            throw new IdPClientException(error, axisFault.getCause());
        }

        for (Map.Entry<String, OAuthApplicationInfo> entry : this.oAuthAppInfoMap.entrySet()) {
            String appContext = entry.getKey();
            OAuthApplicationInfo oAuthApp = entry.getValue();

            String clientId = oAuthApp.getClientId();
            String clientSecret = oAuthApp.getClientSecret();
            String clientName = oAuthApp.getClientName();
            if (clientId != null && clientSecret != null) {
                OAuthApplicationInfo newOAuthApp = new OAuthApplicationInfo(clientName, clientId, clientSecret);
                this.oAuthAppInfoMap.replace(appContext, newOAuthApp);
            } else {
                registerApplication(appContext, clientName, kmUserName);
            }
        }
    }

    /*
    * NOTE: For this apim idp client we have treated scopes as roles. So, whenever roles are requested, instead of roles
    *  we provide corresponding scopes. These scopes are read from the tenant-conf.json file in api manager product.
    * https://github.com/wso2/carbon-apimgt/blob/master/components/apimgt/org.wso2.carbon.apimgt.impl/src/main/
    * resources/tenant/tenant-conf.json
    * This move taken due to roadblocks occurred when getting user roles in multi-tenancy scenario.
    * */
    @Override
    public List<Role> getAllRoles() throws IdPClientException {
        String[] scopeList = this.allScopes.split(" ");
        return getRolesFromArray(scopeList);
    }

    @Override
    public Role getAdminRole() throws IdPClientException {
        if (this.adminScopeName == null) {
            String error = "Error occurred while getting the admin scope name.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        return new Role(this.adminScopeName, this.adminScopeName);
    }

    @Override
    public User getUser(String name) throws IdPClientException {
        ExternalSession session = null;
        for (ExternalSession externalSession : tokenCache.asMap().values()) {
            if (externalSession.getUserName().equalsIgnoreCase(name)) {
                session = externalSession;
                break;
            }
        }
        if (session == null) {
            String error = "Error occurred while getting the user.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        String token = session.getAccessToken();
        OAuth2IntrospectionResponse introspectResponse;
        try {
            introspectResponse = getIntrospectResponse(token);
        } catch (AuthenticationException e) {
            // If there is an Authentication error that means the token is inactive. So there is no user available and
            // hence, returns null. This null is handled in the getUserRoles() method in Super class(ExternalIdPClient).
            return null;
        }
        String scopes = introspectResponse.getScope();
        String[] scopeList = scopes.split(SPACE);
        ArrayList<Role> roles = getRolesFromArray(scopeList);
        Map<String, String> properties = new HashMap<>();
        return new User(name, properties, roles);
    }

    /**
     * This method returns a list of Roles from a given String array which contains scopes. Please note that we consider
     * scopes as roles in this idp client.
     * @param scopes String array which contains scope names
     * @return Array List of scopes as roles
     * @throws IdPClientException thrown when the node list is empty.
     */
    private ArrayList<Role> getRolesFromArray(String[] scopes) throws IdPClientException {
        if (scopes.length == 0) {
            String error = "Cannot get roles from the list as the scope list is empty.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        ArrayList<Role> roles = new ArrayList<>();
        Role newRole;
        for (String scope : scopes) {
            newRole = new Role(scope, scope);
            roles.add(newRole);
        }
        return roles;
    }

    /**
     * This method checks whether a given oAuth application exists using OAuthAdminService.
     * @param oAuthAppName oAuth application name
     * @return whether the application exists
     * @throws IdPClientException thrown when an error occurred when retrieving applications data from
     * OAuthAdminService service
     */
    private boolean isOAuthApplicationExists(String oAuthAppName) throws IdPClientException {
        try {
            OAuthConsumerAppDTO[] oAuthApps = this.oAuthAdminServiceClient.getAllOAuthApplicationData();
            if (oAuthApps == null) {
                return false;
            }
            for (OAuthConsumerAppDTO oAuthApp : oAuthApps) {
                if (oAuthApp.getApplicationName().equalsIgnoreCase(oAuthAppName)) {
                    return true;
                }
            }
        } catch (RemoteException | OAuthAdminServiceIdentityOAuthAdminException e) {
            String error = "Error occurred while getting all the OAuth application data.";
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        return false;
    }

    /**
     * This methods returns data of a OAuthApplication using OAuthAdminService.
     * @param oAuthAppName oAuth application name
     * @return properties Map of OAuthApplication data which includes oauthConsumerKey and oauthConsumerSecret
     * @throws IdPClientException thrown when an error occurred when retrieving application data from
     * OAuthAdminService service
     */
    private Map<String, String> getOAuthApplicationData(String oAuthAppName) throws IdPClientException {
        Map<String, String> oAuthAppDataMap = new HashMap<>();
        try {
            OAuthConsumerAppDTO oAuthApp = this.oAuthAdminServiceClient.getOAuthApplicationDataByAppName(oAuthAppName);
            oAuthAppDataMap.put("oauthConsumerKey", oAuthApp.getOauthConsumerKey());
            oAuthAppDataMap.put("oauthConsumerSecret", oAuthApp.getOauthConsumerSecret());
        } catch (RemoteException | OAuthAdminServiceIdentityOAuthAdminException e) {
            String error = "Error occurred while getting the OAuth application data for the application name:"
                    + oAuthAppName;
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        if (oAuthAppDataMap.isEmpty()) {
            String error = "No OAuth Application data found for the application name: " + oAuthAppName;
            LOG.error(error);
            throw new IdPClientException(error);
        }
        return oAuthAppDataMap;
    }

    @Override
    public Map<String, String> login(Map<String, String> properties) throws IdPClientException {
        this.init(this.kmUserName);
        Map<String, String> returnProperties = new HashMap<>();
        String grantType = properties.getOrDefault(IdPClientConstants.GRANT_TYPE, this.grantType);

        Response response;
        String oAuthAppContext = properties.get(IdPClientConstants.APP_NAME);

        //Checking if these are the frontend-if not use sp
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }

        String username = properties.get(IdPClientConstants.USERNAME);
        if (IdPClientConstants.AUTHORIZATION_CODE_GRANT_TYPE.equals(grantType)) {
            String callbackUrl = properties.get(IdPClientConstants.CALLBACK_URL);
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_REDIRECTION);
            returnProperties.put(IdPClientConstants.CLIENT_ID, this.oAuthAppInfoMap.get(oAuthAppContext).getClientId());
            returnProperties.put(IdPClientConstants.REDIRECTION_URL, this.authorizeEndpoint);
            returnProperties.put(IdPClientConstants.CALLBACK_URL, this.baseUrl +
                    ApimIdPClientConstants.CALLBACK_URL + callbackUrl);
            returnProperties.put(IdPClientConstants.SCOPE, this.allScopes);
            return returnProperties;
        } else if (IdPClientConstants.PASSWORD_GRANT_TYPE.equals(grantType)) {
            response = oAuth2ServiceStubs.getTokenServiceStub().generatePasswordGrantAccessToken(
                    username, properties.get(IdPClientConstants.PASSWORD),
                    properties.get(IdPClientConstants.APP_ID), this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());
        } else {
            response = oAuth2ServiceStubs.getTokenServiceStub().generateRefreshGrantAccessToken(
                    properties.get(IdPClientConstants.REFRESH_TOKEN), null,
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());
        }

        if (response == null) {
            String error = "Error occurred while generating an access token for grant type '" +
                    removeCRLFCharacters(grantType) + "'. Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {   //200 - Success
            if (LOG.isDebugEnabled()) {
                LOG.debug("A new access token is successfully generated.");
            }
            try {
                OAuth2TokenInfo oAuth2TokenInfo = (OAuth2TokenInfo) new GsonDecoder().decode(response,
                        OAuth2TokenInfo.class);
                returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_SUCCESS);
                returnProperties.put(IdPClientConstants.USERNAME, username);
                returnProperties.put(IdPClientConstants.ACCESS_TOKEN, oAuth2TokenInfo.getAccessToken());
                returnProperties.put(IdPClientConstants.REFRESH_TOKEN, oAuth2TokenInfo.getRefreshToken());
                returnProperties.put(IdPClientConstants.VALIDITY_PERIOD,
                        Long.toString(oAuth2TokenInfo.getExpiresIn()));
                if (IdPClientConstants.PASSWORD_GRANT_TYPE.equals(grantType)) {
                    tokenCache.put(oAuth2TokenInfo.getAccessToken(),
                            new ExternalSession(username, oAuth2TokenInfo.getAccessToken()));
                }
                return returnProperties;
            } catch (IOException e) {
                String error = "Error occurred while parsing token response for user. Response: '" +
                        response.body().toString() + "'.";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else if (response.status() == 401) {
            String invalidResponse = "Unable to get access token for the request with grant type : '" + grantType +
                    "', for the user '" + username + "'.";
            LOG.error(invalidResponse);
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_FAILURE);
            returnProperties.put(IdPClientConstants.ERROR, IdPClientConstants.Error.INVALID_CREDENTIALS);
            returnProperties.put(IdPClientConstants.ERROR_DESCRIPTION, invalidResponse);
            return returnProperties;
        } else {  //Error case
            String errorMessage = "Token generation request failed. HTTP error code: '" + response.status() +
                    "'. Error Response: '" + response.body().toString() + "'.";
            LOG.error(errorMessage);
            throw new IdPClientException(errorMessage);
        }
    }

    @Override
    public Map<String, String> logout(Map<String, String> properties) throws IdPClientException {
        String token = properties.get(IdPClientConstants.ACCESS_TOKEN);
        String oAuthAppContext = properties.getOrDefault(IdPClientConstants.APP_NAME,
                ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT);
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }
        tokenCache.invalidate(token);
        oAuth2ServiceStubs.getRevokeServiceStub().revokeAccessToken(
                token,
                this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());

        Map<String, String> returnProperties = new HashMap<>();
        String idToken = properties.getOrDefault(IdPClientConstants.ID_TOKEN_KEY, null);
        if (!isSSOEnabled || idToken == null) {
            returnProperties.put(IdPClientConstants.RETURN_LOGOUT_PROPERTIES, "false");
        } else {
            String postLogoutRedirectUrl = this.baseUrl + FORWARD_SLASH + oAuthAppContext;

            returnProperties.put(IdPClientConstants.RETURN_LOGOUT_PROPERTIES, "true");
            String targetURIForRedirection = ssoLogoutURL
                    .concat(ApimIdPClientConstants.SSO_LOGING_ID_TOKEN_TAIL)
                    .concat(idToken)
                    .concat(POST_LOGOUT_REDIRECT_URI_PHRASE)
                    .concat(postLogoutRedirectUrl);
            returnProperties.put(ApimIdPClientConstants.EXTERNAL_SSO_LOGOUT_URL, targetURIForRedirection);
        }
        return returnProperties;
    }

    @Override
    public Map<String, String> authCodeLogin(String appContext, String code) throws IdPClientException {
        Map<String, String> returnProperties = new HashMap<>();
        String oAuthAppContext = appContext.split("/\\|?")[0];
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }
        OAuthApplicationInfo oAuthApplicationInfo = this.oAuthAppInfoMap.get(oAuthAppContext);
        Response response = oAuth2ServiceStubs.getTokenServiceStub().generateAuthCodeGrantAccessToken(code,
                this.baseUrl + ApimIdPClientConstants.CALLBACK_URL + oAuthAppContext, null,
                oAuthApplicationInfo.getClientId(), oAuthApplicationInfo.getClientSecret());
        if (response == null) {
            String error = "Error occurred while generating an access token from code '" + code + "'. " +
                    "Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {   //200 - Success
            if (LOG.isDebugEnabled()) {
                LOG.debug("A new access token from code is successfully generated for the code '" + code + "'.");
            }
            try {
                OAuth2TokenInfo oAuth2TokenInfo = (OAuth2TokenInfo) new GsonDecoder().decode(response,
                        OAuth2TokenInfo.class);
                returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_SUCCESS);
                returnProperties.put(IdPClientConstants.ACCESS_TOKEN, oAuth2TokenInfo.getAccessToken());
                returnProperties.put(IdPClientConstants.REFRESH_TOKEN, oAuth2TokenInfo.getRefreshToken());
                returnProperties.put(IdPClientConstants.ID_TOKEN_KEY, oAuth2TokenInfo.getIdToken());
                returnProperties.put(IdPClientConstants.VALIDITY_PERIOD,
                        Long.toString(oAuth2TokenInfo.getExpiresIn()));
                returnProperties.put(ApimIdPClientConstants.REDIRECT_URL,
                        this.baseUrl + (this.baseUrl.endsWith("/") ? appContext : "/" + appContext));
                Response introspectTokenResponse = oAuth2ServiceStubs.getIntrospectionServiceStub()
                        .introspectAccessToken(oAuth2TokenInfo.getAccessToken());
                String authUser = null;
                if (introspectTokenResponse.status() == 200) {   //200 - Success
                    OAuth2IntrospectionResponse introspectResponse = (OAuth2IntrospectionResponse) new GsonDecoder()
                            .decode(introspectTokenResponse, OAuth2IntrospectionResponse.class);
                    authUser = introspectResponse.getUsername();
                    returnProperties.put(IdPClientConstants.USERNAME, authUser);
                } else {
                    if (LOG.isDebugEnabled()) {
                        LOG.debug("Unable to get the username from introspection of the token '" +
                                oAuth2TokenInfo.getAccessToken() + "'. Response : '" +
                                introspectTokenResponse.toString());
                    }
                }
                if (authUser != null) {
                    tokenCache.put(oAuth2TokenInfo.getAccessToken(),
                            new ExternalSession(authUser, oAuth2TokenInfo.getAccessToken()));
                }
                return returnProperties;
            } catch (IOException e) {
                String error = "Error occurred while parsing token response. Response : '" +
                        response.body().toString() + "'";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else if (response.status() == 401) {
            String invalidResponse = "Unauthorized user for accessing token form code '" + code + "'. for the app " +
                    "context, '" + appContext + "'";
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_FAILURE);
            returnProperties.put(IdPClientConstants.ERROR, IdPClientConstants.Error.INVALID_CREDENTIALS);
            returnProperties.put(IdPClientConstants.ERROR_DESCRIPTION, invalidResponse);
            return returnProperties;
        } else {  //Error case
            String error = "Token generation request failed. HTTP error code: '" + response.status() +
                    "'. Error Response Body: '" + response.body().toString() + "'.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
    }

    @Override
    public String authenticate(String token) throws AuthenticationException, IdPClientException {
        ExternalSession session = tokenCache.getIfPresent(token);
        if (session != null) {
            return session.getUserName();
        }
        OAuth2IntrospectionResponse introspectResponse = getIntrospectResponse(token);
        String username = introspectResponse.getUsername();
        tokenCache.put(username, new ExternalSession(username, token));
        return username;
    }

    /**
     * This method returns response got from the introspection if the introspection is active.
     * @param token  token which needs to be introspected
     * @throws IdPClientException thrown when an error occurred when performing introspect
     * @throws AuthenticationException thrown when the token is not active
     * @return the introspect response
     */
    private OAuth2IntrospectionResponse getIntrospectResponse(String token) throws IdPClientException,
            AuthenticationException {
        Response response = oAuth2ServiceStubs.getIntrospectionServiceStub().introspectAccessToken(token);

        if (response == null) {
            String error = "Error occurred while authenticating token '" + token + "'. Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        try {
            if (response.status() == 200) {  //200 - OK
                OAuth2IntrospectionResponse introspectResponse = (OAuth2IntrospectionResponse) new GsonDecoder()
                        .decode(response, OAuth2IntrospectionResponse.class);
                if (introspectResponse.isActive()) {
                    return introspectResponse;
                } else {
                    String error = "The token is not active.";
                    throw new AuthenticationException(error);
                }
            } else if (response.status() == 400) {  //400 - Known Error
                try {
                    DCRError error = (DCRError) new GsonDecoder().decode(response, DCRError.class);
                    String errorString = "Error occurred while introspecting the token. Error: " + error.getErrorCode()
                            + ". Error Description: " + error.getErrorDescription() + ". Status Code: "
                            + response.status();
                    LOG.error(errorString);
                    throw new IdPClientException(errorString);
                } catch (IOException e) {
                    String error = "Error occurred while parsing the Introspection error message.";
                    LOG.error(error, e);
                    throw new IdPClientException(error, e);
                }
            } else {  //Unknown Error
                String error = "Error occurred while authenticating. Error: '" + response.body().toString()
                        + "'. Status Code: '" + response.status() + "'.";
                LOG.error(error);
                throw new IdPClientException(error);
            }
        } catch (IOException e) {
            String error = "Error occurred while parsing the authentication response.";
            LOG.error(error, e);
            throw new IdPClientException(error, e);
        }
    }

    /**
     * This method registers a application using a DCR call if the OAuth application does not exists. If is exists it
     * retrieves the application data and saved in oAuthAppInfoMap.
     * @param appContext  context of the application
     * @param clientName name of the client
     * @param kmUserName username of the key manager
     * @throws IdPClientException thrown when an error occurred when sending the DCR call or retrieving application
     * data using OAuthAdminService service
     */
    private void registerApplication(String appContext, String clientName, String kmUserName)
            throws IdPClientException {
        if (isOAuthApplicationExists(kmUserName + "_" + clientName)) {
            Map<String, String> oAuthAppDataMap = getOAuthApplicationData(kmUserName + "_" + clientName);
            OAuthApplicationInfo oAuthApplicationInfo = new OAuthApplicationInfo(
                    clientName, oAuthAppDataMap.get("oauthConsumerKey"), oAuthAppDataMap.get("oauthConsumerSecret")
            );
            this.oAuthAppInfoMap.replace(appContext, oAuthApplicationInfo);
            return;
        }

        String grantType =
                IdPClientConstants.PASSWORD_GRANT_TYPE + " " + IdPClientConstants.AUTHORIZATION_CODE_GRANT_TYPE + " " +
                        IdPClientConstants.REFRESH_GRANT_TYPE;
        String callBackUrl;
        String postLogoutRedirectUrl = this.baseUrl + FORWARD_SLASH + appContext;
        if (clientName.equals(ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT)) {
            callBackUrl = ApimIdPClientConstants.REGEX_BASE_START + this.baseUrl +
                    ApimIdPClientConstants.CALLBACK_URL + REGEX_BASE + postLogoutRedirectUrl + REGEX_BASE_END;
        } else {
            callBackUrl = ApimIdPClientConstants.REGEX_BASE_START + this.baseUrl +
                    ApimIdPClientConstants.CALLBACK_URL + appContext + REGEX_BASE + postLogoutRedirectUrl
                    + REGEX_BASE_END;
        }

        if (LOG.isDebugEnabled()) {
            LOG.debug("Creating OAuth2 application of name '" + clientName + "'.");
        }
        DCRClientInfo dcrClientInfo = new DCRClientInfo();
        dcrClientInfo.setClientName(clientName);
        dcrClientInfo.setGrantType(grantType);
        dcrClientInfo.setCallbackUrl(callBackUrl);
        dcrClientInfo.setSaasApp(true);
        dcrClientInfo.setOwner(kmUserName);

        Response response = dcrmServiceStub.registerApplication(new Gson().toJson(dcrClientInfo));
        if (response == null) {
            String error = "Error occurred while DCR application '" + dcrClientInfo + "' creation. " +
                    "Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {  //200 - OK
            try {
                DCRClientResponse dcrClientInfoResponse = (DCRClientResponse) new GsonDecoder()
                        .decode(response, DCRClientResponse.class);
                OAuthApplicationInfo oAuthApplicationInfo = new OAuthApplicationInfo(
                        clientName, dcrClientInfoResponse.getClientId(), dcrClientInfoResponse.getClientSecret()
                );
                this.oAuthAppInfoMap.replace(appContext, oAuthApplicationInfo);
                if (LOG.isDebugEnabled()) {
                    LOG.debug("OAuth2 application created: " + oAuthApplicationInfo.toString());
                }
            } catch (IOException e) {
                String error = "Error occurred while parsing the DCR application creation response " +
                        "message. Response: '" + response.body().toString() + "'.";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else if (response.status() == 400) {  //400 - Known Error
            try {
                DCRError error = (DCRError) new GsonDecoder().decode(response, DCRError.class);
                String errorMessage = "Error occurred while DCR application creation. Error: " +
                        error.getErrorCode() + ". Error Description: " + error.getErrorDescription() +
                        ". Status Code: " + response.status();
                LOG.error(errorMessage);
                throw new IdPClientException(errorMessage);
            } catch (IOException e) {
                String error = "Error occurred while parsing the DCR error message. Error: " +
                        "'" + response.body().toString() + "'.";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else {  //Unknown Error
            String error = "Error occurred while DCR application creation. Error: '" +
                    response.body().toString() + "'. Status Code: '" + response.status() + "'.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
    }

    private static String removeCRLFCharacters(String str) {
        if (str != null) {
            str = str.replace('\n', '_').replace('\r', '_');
        }
        return str;
    }
}
