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

import java.util.ArrayList;
import java.util.List;

/**
 * Configs for database which hold table entries.
 */
@Configuration(namespace = "database.table.configurations", description = "Table configs for each database")
public class DatabaseInfo {

    @Element(description = "Table name", required = true)
    private String databaseName = "APIM_ANALYTICS_DB";

    @Element(description = "table entries where username is included in.")
    private List<TableEntryInfo> tableEntries = new ArrayList<>();

    public String getDatabaseName() {
        return databaseName;
    }

    public void setDatabaseName(String databaseName) {
        this.databaseName = databaseName;
    }

    public List<TableEntryInfo> getTableEntries() {
        return tableEntries;
    }

    public void setTableEntries(List<TableEntryInfo> tableEntries) {
        this.tableEntries = tableEntries;
    }
}
