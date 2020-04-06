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
package org.wso2.analytics.apim.gdpr.client.bean;

import org.wso2.carbon.config.annotation.Configuration;
import org.wso2.carbon.config.annotation.Element;
import org.wso2.carbon.database.query.manager.config.Queries;

import java.util.ArrayList;
import java.util.List;

/**
 * GDPR Client configurations.
 */
@Configuration(namespace = "wso2.gdpr", description = "GDPR Client Configuration Parameters")
public class GDPRClientConfiguration {

    @Element(description = "username which the PII data should be deleted", required = true)
    private String username;

    @Element(description = "pseudonym which is used to replace the username")
    private String pseudonym;

    @Element(description = "tenant domain of the user")
    private String tenantDomain = "carbon.super";

    @Element(description = "email of the user")
    private String userEmail;

    @Element(description = "ip address of the user")
    private String userIP;

    @Element(description = "databases which includes the username entries in its tables", required = true)
    private List<DatabaseInfo> databases = new ArrayList<>();

    @Element(description = "database query map")
    private List<Queries> queries = new ArrayList<>();

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPseudonym() {
        return pseudonym;
    }

    public void setPseudonym(String pseudonym) {
        this.pseudonym = pseudonym;
    }

    public String getTenantDomain() {
        return tenantDomain;
    }

    public void setTenantDomain(String tenantDomain) {
        this.tenantDomain = tenantDomain;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserIP() {
        return userIP;
    }

    public void setUserIP(String userIP) {
        this.userIP = userIP;
    }

    public List<DatabaseInfo> getDatabases() {
        return databases;
    }

    public void setDatabases(List<DatabaseInfo> databases) {
        this.databases = databases;
    }

    public List<Queries> getQueries() {
        return queries;
    }

    public void setQueries(List<Queries> queries) {
        this.queries = queries;
    }
}
