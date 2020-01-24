/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.idp.client.util;

import org.wso2.carbon.analytics.idp.client.core.utils.config.IdPClientConfiguration;
import org.wso2.carbon.analytics.idp.client.core.utils.config.RESTAPIConfigurationElement;
import org.wso2.carbon.analytics.idp.client.core.utils.config.UserManagerElement;
import org.wso2.carbon.config.annotation.Configuration;
import org.wso2.carbon.config.annotation.Element;
import org.wso2.carbon.database.query.manager.config.Queries;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.EXTERNAL_IDP_CLIENT_TYPE;

/**
 * IdP configurations.
 */
@Configuration(namespace = "auth.configs", description = "Authorization Configuration Parameters")
public class ApimIdPClientConfiguration extends IdPClientConfiguration {

    @Element(description = "Client Type", required = true)
    private String type = EXTERNAL_IDP_CLIENT_TYPE;

    @Element(description = "SSO enabled")
    private boolean ssoEnabled = false;

    @Element(description = "Client properties")
    private Map<String, String> properties = new HashMap<>();

    @Element(description = "REST API configuration")
    private RESTAPIConfigurationElement restAPIAuthConfigs = new RESTAPIConfigurationElement();

    @Element(description = "User Manager")
    private UserManagerElement userManager = new UserManagerElement();

    @Element(description = "Database query map")
    private ArrayList<Queries> queries = new ArrayList<>();

    @Override
    public String getType() {
        return type;
    }

    @Override
    public Map<String, String> getProperties() {
        return properties;
    }

    @Override
    public RESTAPIConfigurationElement getRestAPIAuthConfigs() {
        return restAPIAuthConfigs;
    }

    @Override
    public UserManagerElement getUserManager() {
        return userManager;
    }

    @Override
    public ArrayList<Queries> getQueries() {
        return queries;
    }

    @Override
    public boolean isSsoEnabled() {
        return ssoEnabled;
    }
}
