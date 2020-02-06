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
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.dashboards.core.DashboardThemeConfigProvider;
import org.wso2.carbon.dashboards.core.bean.DashboardConfigurations;
import org.wso2.carbon.dashboards.core.exception.DashboardException;


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

    private DashboardConfigurations dashboardConfigurations;

    @Reference(service = ConfigProvider.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unsetConfigProvider")
    protected void setConfigProvider(ConfigProvider configProvider) {
        try {
            this.dashboardConfigurations = configProvider.getConfigurationObject(DashboardConfigurations.class);
        } catch (ConfigurationException e) {
            LOGGER.error("Cannot load dashboard configurations from 'deployment.yaml'. Falling-back to defaults.", e);
            this.dashboardConfigurations = new DashboardConfigurations();
        }
    }

    protected void unsetConfigProvider(ConfigProvider configProvider) {
        LOGGER.debug("An instance of class '{}' unregistered as a config provider.",
                configProvider.getClass().getName());
    }

    @Override
    public String getPath(String username) throws DashboardException {
        String themeConfigResourcesPath = this.dashboardConfigurations.getThemeConfigResourcesPath();
        if (themeConfigResourcesPath == null || themeConfigResourcesPath.isEmpty()) {
            String error = "The themeConfigResourcesPath property cannot be found from the deployment.yaml file.";
            LOGGER.error(error);
            throw new DashboardException(error);
        }
        String tenantDomain = extractTenantDomainFromUserName(username);
        String path = themeConfigResourcesPath + "/" + tenantDomain;
        LOGGER.debug("Custom theme resources path returned via '{}' class for user: '{}.'",
                this.getClass().getName(), username);
        return path;
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
            String error = "Username cannot be empty.";
            LOGGER.error(error);
            throw new DashboardException(error);
        }
        String[] usernameSections = username.split(AT);
        String tenantDomain = usernameSections[usernameSections.length - 1];
        if (tenantDomain == null) {
            String error = "Cannot get the tenant domain from the given username: " + username;
            LOGGER.error(error);
            throw new DashboardException(error);
        }
        return tenantDomain;
    }
}
