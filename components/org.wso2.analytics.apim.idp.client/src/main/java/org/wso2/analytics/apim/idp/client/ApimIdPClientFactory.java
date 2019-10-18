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
import org.wso2.carbon.analytics.idp.client.core.api.AnalyticsHttpClientBuilderService;
import org.wso2.carbon.analytics.idp.client.core.api.IdPClient;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.spi.IdPClientFactory;
import org.wso2.carbon.analytics.idp.client.core.utils.IdPClientConstants;
import org.wso2.carbon.analytics.idp.client.core.utils.config.IdPClientConfiguration;
import org.wso2.carbon.analytics.idp.client.external.impl.DCRMServiceStub;
import org.wso2.carbon.analytics.idp.client.external.impl.OAuth2ServiceStubs;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.secvault.SecretRepository;
import org.wso2.carbon.utils.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
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
    private SecretRepository secretRepository;
    private AnalyticsHttpClientBuilderService analyticsHttpClientBuilderService;

    @Activate
    protected void activate(BundleContext bundleContext) {
        LOG.debug("APIM IDP client factory activated.");
    }

    @Deactivate
    protected void deactivate(BundleContext bundleContext) {
        LOG.debug("APIM IDP client factory deactivated.");
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

    /**
     * Register secret repository.
     *
     * @param secretRepository
     */
    @Reference(
            name = "org.wso2.carbon.secvault.repository.DefaultSecretRepository",
            service = SecretRepository.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterSecretRepository"
    )
    protected void registerSecretRepository(SecretRepository secretRepository) {
        this.secretRepository = secretRepository;
    }

    /**
     * Unregister secret repository.
     *
     * @param secretRepository
     */
    protected void unregisterSecretRepository(SecretRepository secretRepository) {
        this.secretRepository = null;
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
        String adminServiceBaseUrl = properties.getOrDefault(ApimIdPClientConstants.ADMIN_SERVICE_BASE_URL,
                ApimIdPClientConstants.DEFAULT_ADMIN_SERVICE_BASE_URL);
        String adminScopeName = properties.getOrDefault(ApimIdPClientConstants.ADMIN_SCOPE,
                ApimIdPClientConstants.DEFAULT_ADMIN_SCOPE);
        String allScopes = properties.getOrDefault(ApimIdPClientConstants.ALL_SCOPES,
                ApimIdPClientConstants.DEFAULT_ALL_SCOPES);

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

        if (StringUtils.isNullOrEmpty(adminServiceBaseUrl)) {
            String error = "Admin service base url cannot be empty. Please provide an admin service base url in the " +
                    "deployment.yaml file.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        URI uri;
        try {
            uri = new URI(adminServiceBaseUrl);
        } catch (URISyntaxException e) {
            String error = "Error occurred while creating uri from given admin service base url: "
                    + adminServiceBaseUrl;
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        String uriHost = uri.getHost();
        if (uriHost == null) {
            String error = "Cannot get the uri host for the given admin service base url: " + adminServiceBaseUrl;
            LOG.error(error);
            throw new IdPClientException(error);
        }

        int cacheTimeout, connectionTimeout, readTimeout;
        try {
            cacheTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.CACHE_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_CACHE_TIMEOUT));
        } catch (NumberFormatException e) {
            String error = "Cache timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.CACHE_TIMEOUT) + "' is invalid.";
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        try {
            connectionTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.CONNECTION_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_CONNECTION_TIMEOUT));
        } catch (NumberFormatException e) {
            String error = "Connection timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.CONNECTION_TIMEOUT) + "' is invalid.";
            LOG.error(error);
            throw new IdPClientException(error, e);
        }
        try {
            readTimeout = Integer.parseInt(properties.getOrDefault(ApimIdPClientConstants.READ_TIMEOUT,
                    ApimIdPClientConstants.DEFAULT_READ_TIMEOUT));
        } catch (NumberFormatException e) {
            String error = "Read timeout overriding property '" +
                    properties.get(ApimIdPClientConstants.READ_TIMEOUT) + "' is invalid.";
            LOG.error(error);
            throw new IdPClientException(error, e);
        }

        DCRMServiceStub dcrmServiceStub = this.analyticsHttpClientBuilderService
                .build(kmUsername, kmPassword, connectionTimeout, readTimeout, DCRMServiceStub.class, dcrEndpoint);
        OAuth2ServiceStubs keyManagerServiceStubs = new OAuth2ServiceStubs(
                this.analyticsHttpClientBuilderService, kmTokenUrl + ApimIdPClientConstants.TOKEN_POSTFIX,
                kmTokenUrl + ApimIdPClientConstants.REVOKE_POSTFIX, introspectUrl,
                kmUsername, kmPassword, connectionTimeout, readTimeout);

        String targetURIForRedirection = properties.getOrDefault(ApimIdPClientConstants.EXTERNAL_SSO_LOGOUT_URL,
                            ApimIdPClientConstants.DEFAULT_EXTERNAL_SSO_LOGOUT_URL);

        return new ApimIdPClient(adminServiceBaseUrl, adminServiceUsername, adminServicePassword, uriHost, baseUrl,
                kmTokenUrl + ApimIdPClientConstants.AUTHORIZE_POSTFIX, grantType, adminScopeName, allScopes,
                oAuthAppInfoMap, cacheTimeout, dcrAppOwner, dcrmServiceStub, keyManagerServiceStubs,
                idPClientConfiguration.isSsoEnabled(), targetURIForRedirection);
    }
}
