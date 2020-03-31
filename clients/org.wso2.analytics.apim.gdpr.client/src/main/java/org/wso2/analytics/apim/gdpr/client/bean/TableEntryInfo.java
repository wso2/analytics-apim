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

import org.wso2.carbon.config.annotation.Element;

/**
 * Table entry configurations.
 */
public class TableEntryInfo {

    @Element(description = "Table name", required = true)
    private String tableName = "";

    @Element(description = "Column name which includes the username", required = true)
    private String columnName = "";

    @Element(description = "Is the username includes the tenant domain")
    private boolean usernameWithTenantDomain = false;

    @Element(description = "Column name which has the tenant domain")
    private String tenantDomainColumnName = "";

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getColumnName() {
        return columnName;
    }

    public void setColumnName(String columnName) {
        this.columnName = columnName;
    }

    public boolean isUsernameWithTenantDomain() {
        return usernameWithTenantDomain;
    }

    public void setUsernameWithTenantDomain(boolean usernameWithTenantDomain) {
        this.usernameWithTenantDomain = usernameWithTenantDomain;
    }

    public String getTenantDomainColumnName() {
        return tenantDomainColumnName;
    }

    public void setTenantDomainColumnName(String tenantDomainColumnName) {
        this.tenantDomainColumnName = tenantDomainColumnName;
    }
}
