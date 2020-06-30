/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.dashboards.theme.config.provider;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.carbon.analytics.idp.client.core.utils.config.IdPClientConfiguration;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.dashboards.core.DashboardThemeConfigProvider;
import org.wso2.carbon.dashboards.core.bean.DashboardConfigurations;
import org.wso2.carbon.dashboards.core.exception.DashboardException;

import java.io.File;
import java.util.Map;

/**
 * Default implementation for Default Dashboard Theme Config Provider.
 */
@Component(
        service = DashboardThemeConfigProvider.class,
        immediate = true
)
public class CustomDashboardThemeConfigProvider implements DashboardThemeConfigProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(CustomDashboardThemeConfigProvider.class);
    private static final String AT = "@";

    private static final String THEME_DIR = File.separator + "wso2" + File.separator + "dashboard" + File.separator +
            "deployment" + File.separator + "web-ui-apps" + File.separator + "analytics-dashboard" + File.separator +
            "public";
    private static final String IMAGES_DIR = File.separator + "analytics" + File.separator + "images" + File.separator;
    private static final String THEME_URL = "/public/app";

    private static final String DEFAULT_IMAGE_DIR = File.separator + "public" + File.separator + "app" +
            File.separator + "images" + File.separator;
    private static final String DEFAULT_FAVICON_FILE = "favicon.ico";
    private static final String DEFAULT_LOGO_FILE = "logo.svg";

    public static final String BASE_URL = "baseUrl";
    public static final String DEFAULT_BASE_URL = "https://localhost:9643";
    public static final String PORTAL_APP_CONTEXT = "portalAppContext";
    public static final String DEFAULT_PORTAL_APP_CONTEXT = "analytics-dashboard";

    private IdPClientConfiguration idPClientConfiguration;
    private DashboardConfigurations dashboardConfigurations;

    @Reference(service = ConfigProvider.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unsetConfigProvider")
    protected void setConfigProvider(ConfigProvider configProvider) {
        try {
            this.idPClientConfiguration = configProvider.getConfigurationObject(IdPClientConfiguration.class);
            this.dashboardConfigurations = configProvider.getConfigurationObject(DashboardConfigurations.class);
        } catch (ConfigurationException e) {
            LOGGER.error("Cannot load configurations from 'deployment.yaml'. Falling-back to defaults.", e);
            this.idPClientConfiguration = new IdPClientConfiguration();
            this.dashboardConfigurations = new DashboardConfigurations();
        }
    }

    protected void unsetConfigProvider(ConfigProvider configProvider) {
        LOGGER.debug("An instance of class '{}' unregistered as a config provider.",
                configProvider.getClass().getName());
    }

    @Override
    public String getFaviconPath(String username) throws DashboardException {
        String tenantDomain = extractTenantDomainFromUserName(username);
        String faviconPath = File.separator + tenantDomain + IMAGES_DIR +
                this.dashboardConfigurations.getFaviconFileName();

        File faviconFile = new File(System.getProperty("carbon.home") + THEME_DIR + faviconPath);
        if (faviconFile.exists()) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Custom favicon file '{}' returned via '{}' class for user: '{}.'",
                        faviconPath, this.getClass().getName(), username);
            }
            return getAppUrl() + THEME_URL + faviconPath;
        } else {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Custom favicon file doesn't exist and falling back to defaults");
            }
            return getAppUrl() + DEFAULT_IMAGE_DIR + DEFAULT_FAVICON_FILE;
        }
    }

    @Override
    public String getLogoPath(String username) throws DashboardException {
        String tenantDomain = extractTenantDomainFromUserName(username);
        String logoPath = File.separator + tenantDomain + IMAGES_DIR +
                this.dashboardConfigurations.getLogoFileName();

        File logoFile = new File(System.getProperty("carbon.home") + THEME_DIR + logoPath);
        if (logoFile.exists()) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Custom logo file '{}' returned via '{}' class for user: '{}.'",
                        logoPath, this.getClass().getName(), username);
            }
            return getAppUrl() + THEME_URL + logoPath;
        } else {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Custom logo file doesn't exist and falling back to defaults");
            }
            return getAppUrl() + DEFAULT_IMAGE_DIR + DEFAULT_LOGO_FILE;
        }
    }

    /**
     * This method returns a tenant domain of the user. For example if the username is "admin@carbon.super" tenant
     * domain will be returned as "carbon.super".
     * @param username String array which contains scope names
     * @return Tenant domain of the user
     * @throws DashboardException thrown when the username is empty or when an error occurred when retrieve the tenant
     * domain.
     */
    private String extractTenantDomainFromUserName(String username) throws DashboardException {
        if (username == null || username.isEmpty()) {
            throw new DashboardException("Username cannot be empty.");
        }
        String[] usernameSections = username.split(AT);
        String tenantDomain = usernameSections[usernameSections.length - 1];
        if (tenantDomain == null) {
            throw new DashboardException("Cannot get the tenant domain from the given username: " + username);
        }
        return tenantDomain;
    }

    /**
     * This method returns the analytics dashboard app url by combining the base url and the app context
     * configured in the deployment.yaml (ex: https://localhost:9643/analytics-dashboard)
     * @return application url
     */
    private String getAppUrl() {
        Map<String, String> properties = idPClientConfiguration.getProperties();
        return properties.getOrDefault(BASE_URL, DEFAULT_BASE_URL) + "/" +
                properties.getOrDefault(PORTAL_APP_CONTEXT, DEFAULT_PORTAL_APP_CONTEXT);
    }
}
