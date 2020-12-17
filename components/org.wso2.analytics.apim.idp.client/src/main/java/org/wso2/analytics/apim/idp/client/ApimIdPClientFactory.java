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

import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.idp.client.dao.OAuthAppDAO;
import org.wso2.analytics.apim.idp.client.token.TokenDataMapCleaner;
import org.wso2.analytics.apim.idp.client.util.SSLConfiguration;
import org.wso2.carbon.analytics.idp.client.core.api.AnalyticsHttpClientBuilderService;
import org.wso2.carbon.analytics.idp.client.core.api.IdPClient;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.spi.IdPClientFactory;
import org.wso2.carbon.analytics.idp.client.core.utils.IdPClientConstants;
import org.wso2.carbon.analytics.idp.client.core.utils.config.IdPClientConfiguration;
import org.wso2.carbon.analytics.idp.client.external.impl.DCRMServiceStub;
import org.wso2.carbon.analytics.idp.client.external.impl.OAuth2ServiceStubs;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.kernel.config.model.CarbonConfiguration;
import org.wso2.carbon.utils.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * Factory for APIM IdPClient.
 */
@Component(
        name = "org.wso2.analytics.apim.idp.client.ApimIdPClientFactory",
        immediate = true
)
public class ApimIdPClientFactory implements IdPClientFactory {
    private static final Logger LOG = LoggerFactory.getLogger(ApimIdPClientFactory.class);
    private DataSourceService dataSourceService;
    private boolean isHostnameVerifierEnabled;
    private AnalyticsHttpClientBuilderService analyticsHttpClientBuilderService;
    private static final String CUSTOM_URL_API_ENDPOINT = "/api/am/admin/v1/custom-urls";
    private TokenDataMapCleaner tokenDataMapCleaner;

    private boolean isSSLConfigsExistInConfigProvider = false;
    private String keyStorePassword;
    private String trustStorePassword;
    private String keyStoreLocation;
    private String trustStoreLocation;

    @Activate
    protected void activate(BundleContext bundleContext) {
        LOG.debug("APIM IDP client factory activated.");

        // Start tokenData map cleaner.
        this.tokenDataMapCleaner = new TokenDataMapCleaner();
        this.tokenDataMapCleaner.startTokenDataMapCleaner();

        // In case keystore/trustore configs are defined in deployment.yaml, override the jvm parameter values set
        // through the carbon.sh files
        if (isSSLConfigsExistInConfigProvider) {
            if (LOG.isDebugEnabled()) {
                LOG.debug("Overriding keystore and truststore configurations in carbon.sh with configuration values "
                                + "included in deployment.yaml");
            }
            System.setProperty("javax.net.ssl.keyStorePassword", this.keyStorePassword);
            System.setProperty("javax.net.ssl.trustStorePassword", this.trustStorePassword);
            System.setProperty("javax.net.ssl.keyStore", this.keyStoreLocation);
            System.setProperty("javax.net.ssl.trustStore", this.trustStoreLocation);
        }
    }

    @Deactivate
    protected void deactivate(BundleContext bundleContext) {
        LOG.debug("APIM IDP client factory deactivated.");

        // Stop tokenData map cleaner.
        this.tokenDataMapCleaner.stopTokenDataMapCleaner();
    }

    /**
     * Register datasource service.
     *
     * @param dataSourceService
     */
    @Reference(
            name = "org.wso2.carbon.datasource.DataSourceService",
            service = DataSourceService.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterDataSourceService"
    )
    protected void registerDataSourceService(DataSourceService dataSourceService) {
        this.dataSourceService = dataSourceService;
    }

    /**
     * Unregister datasource service.
     *
     * @param dataSourceService datasource service
     */
    protected void unregisterDataSourceService(DataSourceService dataSourceService) {
        this.dataSourceService = null;
    }

    @Reference(
            service = AnalyticsHttpClientBuilderService.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterAnalyticsHttpClient"
    )
    protected void registerAnalyticsHttpClient(AnalyticsHttpClientBuilderService service) {
        this.analyticsHttpClientBuilderService = service;
        LOG.debug("@Reference(bind) AnalyticsHttpClientBuilderService at '{}'",
                AnalyticsHttpClientBuilderService.class.getName());
    }

    protected void unregisterAnalyticsHttpClient(AnalyticsHttpClientBuilderService service) {
        LOG.debug("@Reference(unbind) AnalyticsHttpClientBuilderService at '{}'",
                AnalyticsHttpClientBuilderService.class.getName());
        this.analyticsHttpClientBuilderService = null;
    }

    @Reference(
            name = "carbon.config.provider",
            service = ConfigProvider.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterConfigProvider"
    )
    protected void registerConfigProvider(ConfigProvider configProvider) {
        CarbonConfiguration carbonConfiguration;
        SSLConfiguration sslConfiguration;
        try {
            carbonConfiguration = configProvider.getConfigurationObject(CarbonConfiguration.class);
            this.isHostnameVerifierEnabled = carbonConfiguration.isHostnameVerificationEnabled();

            sslConfiguration = configProvider.getConfigurationObject(SSLConfiguration.class);
            this.keyStorePassword = sslConfiguration.getKeyStorePassword();
            this.trustStorePassword = sslConfiguration.getTrustStorePassword();
            this.keyStoreLocation = sslConfiguration.getKeyStoreLocation();
            this.trustStoreLocation = sslConfiguration.getTrustStoreLocation();
            if (!StringUtils.isNullOrEmptyAfterTrim(keyStorePassword)
                    && !StringUtils.isNullOrEmptyAfterTrim(keyStoreLocation)
                    && !StringUtils.isNullOrEmptyAfterTrim(trustStorePassword)
                    && !StringUtils.isNullOrEmptyAfterTrim(trustStoreLocation)) {
                isSSLConfigsExistInConfigProvider = true;
            }
        } catch (ConfigurationException e) {
            LOG.error("Error occurred while initializing ApimIdPClientFactory: " + e.getMessage(), e);
        }
    }

    protected void unregisterConfigProvider(ConfigProvider configProvider) {
        // Nothing to do
    }

    @Override
    public String getType() {
        return ApimIdPClientConstants.EXTERNAL_IDP_CLIENT_TYPE;
    }

    @Override
    public IdPClient getIdPClient(IdPClientConfiguration idPClientConfiguration)
            throws IdPClientException {
        Map<String, String> properties = idPClientConfiguration.getProperties();
        String adminServiceUsername = properties.getOrDefault(ApimIdPClientConstants.ADMIN_USERNAME,
                ApimIdPClientConstants.DEFAULT_ADMIN_SERVICE_USERNAME);
        String adminServicePassword = properties.getOrDefault(ApimIdPClientConstants.ADMIN_PASSWORD,
                ApimIdPClientConstants.DEFAULT_ADMIN_SERVICE_PASSWORD);
        String adminServiceBaseUrl = properties.getOrDefault(ApimIdPClientConstants.ADMIN_SERVICE_BASE_URL_KEY,
                ApimIdPClientConstants.DEFAULT_ADMIN_SERVICE_BASE_URL);
        String adminScopeName = properties.getOrDefault(ApimIdPClientConstants.ADMIN_SCOPE,
                ApimIdPClientConstants.DEFAULT_ADMIN_SCOPE);
        String allScopes = properties.getOrDefault(ApimIdPClientConstants.ALL_SCOPES,
                ApimIdPClientConstants.DEFAULT_ALL_SCOPES);

        String kmTokenUrlForRedirectUrl = properties.getOrDefault(ApimIdPClientConstants.KM_TOKEN_URL_FOR_REDIRECTION,
                ApimIdPClientConstants.DEFAULT_KM_TOKEN_URL_FOR_REDIRECTION);
        String dcrEndpoint = properties.getOrDefault(ApimIdPClientConstants.KM_DCR_URL,
                ApimIdPClientConstants.DEFAULT_KM_DCR_URL);
        String kmUsername = properties.getOrDefault(ApimIdPClientConstants.KM_USERNAME,
                ApimIdPClientConstants.DEFAULT_KM_USERNAME);
        String kmPassword = properties.getOrDefault(ApimIdPClientConstants.KM_PASSWORD,
                ApimIdPClientConstants.DEFAULT_KM_PASSWORD);
        String kmTokenUrl = properties.getOrDefault(ApimIdPClientConstants.KM_TOKEN_URL,
                ApimIdPClientConstants.DEFAULT_KM_TOKEN_URL);
        String dcrAppOwner = properties.getOrDefault(ApimIdPClientConstants.DCR_APP_OWNER, kmUsername);
        String introspectUrl = properties.getOrDefault(ApimIdPClientConstants.INTROSPECTION_URL,
                kmTokenUrl + ApimIdPClientConstants.INTROSPECT_POSTFIX);

        String baseUrl = properties.getOrDefault(ApimIdPClientConstants.BASE_URL,
                ApimIdPClientConstants.DEFAULT_BASE_URL);
        String grantType = properties.getOrDefault(ApimIdPClientConstants.GRANT_TYPE,
                IdPClientConstants.PASSWORD_GRANT_TYPE);


        String portalAppContext = properties.getOrDefault(ApimIdPClientConstants.PORTAL_APP_CONTEXT,
                ApimIdPClientConstants.DEFAULT_PORTAL_APP_CONTEXT);
        String businessAppContext = properties.getOrDefault(ApimIdPClientConstants.BR_DB_APP_CONTEXT,
                ApimIdPClientConstants.DEFAULT_BR_DB_APP_CONTEXT);

        OAuthApplicationInfo spOAuthApp = new OAuthApplicationInfo(
                ApimIdPClientConstants.SP_APP_NAME,
                properties.get(ApimIdPClientConstants.SP_CLIENT_ID),
                properties.get(ApimIdPClientConstants.SP_CLIENT_SECRET));
        OAuthApplicationInfo portalOAuthApp = new OAuthApplicationInfo(
                ApimIdPClientConstants.PORTAL_APP_NAME,
                properties.get(ApimIdPClientConstants.PORTAL_CLIENT_ID),
                properties.get(ApimIdPClientConstants.PORTAL_CLIENT_SECRET));
        OAuthApplicationInfo businessOAuthApp = new OAuthApplicationInfo(
                ApimIdPClientConstants.BR_DB_APP_NAME,
                properties.get(ApimIdPClientConstants.BR_DB_CLIENT_ID),
                properties.get(ApimIdPClientConstants.BR_DB_CLIENT_SECRET));

        Map<String, OAuthApplicationInfo> oAuthAppInfoMap = new HashMap<>();
        oAuthAppInfoMap.put(ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT, spOAuthApp);
        oAuthAppInfoMap.put(portalAppContext, portalOAuthApp);
        oAuthAppInfoMap.put(businessAppContext, businessOAuthApp);

        int cacheTimeout, connectionTimeout, readTimeout;
        try {
            cacheTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.CACHE_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_CACHE_TIMEOUT));
        } catch (NumberFormatException e) {
            throw new IdPClientException("Cache timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.CACHE_TIMEOUT) + "' is invalid.", e);
        }
        try {
            connectionTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.CONNECTION_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_CONNECTION_TIMEOUT));
        } catch (NumberFormatException e) {
            throw new IdPClientException("Connection timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.CONNECTION_TIMEOUT) + "' is invalid.", e);
        }
        try {
            readTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.READ_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_READ_TIMEOUT));
        } catch (NumberFormatException e) {
            throw new IdPClientException("Read timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.READ_TIMEOUT) + "' is invalid.", e);
        }

        String databaseName = properties.getOrDefault(ApimIdPClientConstants.DATABASE_NAME,
                ApimIdPClientConstants.DEFAULT_DATABASE_NAME);
        OAuthAppDAO oAuthAppDAO = new OAuthAppDAO(this.dataSourceService, databaseName,
                idPClientConfiguration.getQueries());

        DCRMServiceStub dcrmServiceStub = this.analyticsHttpClientBuilderService
                .build(kmUsername, kmPassword, connectionTimeout, readTimeout, DCRMServiceStub.class, dcrEndpoint);
        OAuth2ServiceStubs keyManagerServiceStubs = new OAuth2ServiceStubs(
                this.analyticsHttpClientBuilderService, kmTokenUrl + ApimIdPClientConstants.TOKEN_POSTFIX,
                kmTokenUrl + ApimIdPClientConstants.REVOKE_POSTFIX, introspectUrl,
                kmUsername, kmPassword, connectionTimeout, readTimeout);

        String targetURIForRedirection = properties.getOrDefault(ApimIdPClientConstants.EXTERNAL_SSO_LOGOUT_URL,
                            ApimIdPClientConstants.DEFAULT_EXTERNAL_SSO_LOGOUT_URL);

        String adminServiceForCustomUrl = adminServiceBaseUrl + CUSTOM_URL_API_ENDPOINT;
        ApimAdminApiClient apimAdminApiClient = ApimAdminApiClientHolder.
                getApimAdminApiClient(analyticsHttpClientBuilderService, adminServiceForCustomUrl, adminServiceUsername,
                        adminServicePassword);

        // Using builder pattern to create ApimIdpClient object.
        return new ApimIdPClientBuilder()
                .setAdminServiceUsername(adminServiceUsername)
                .setBaseUrl(baseUrl).setoAuthAppDAO(oAuthAppDAO)
                .setAuthorizeEndpoint(kmTokenUrlForRedirectUrl + ApimIdPClientConstants.AUTHORIZE_POSTFIX)
                .setGrantType(grantType)
                .setAdminScopeName(adminScopeName)
                .setAllScopes(allScopes)
                .setoAuthAppInfoMap(oAuthAppInfoMap)
                .setCacheTimeout(cacheTimeout)
                .setKmUserName(dcrAppOwner)
                .setDcrmServiceStub(dcrmServiceStub)
                .setoAuth2ServiceStubs(keyManagerServiceStubs)
                .setIsSSOEnabled(idPClientConfiguration.isSsoEnabled())
                .setSsoLogoutURL(targetURIForRedirection)
                .setIsHostnameVerifierEnabled(this.isHostnameVerifierEnabled)
                .setApimAdminApiClient(apimAdminApiClient)
                .setPortalAppContext(portalAppContext)
                .setBrAppContext(businessAppContext)
                .createApimIdPClient();
    }
}
