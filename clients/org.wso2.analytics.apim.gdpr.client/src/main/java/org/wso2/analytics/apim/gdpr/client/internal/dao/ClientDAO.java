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
package org.wso2.analytics.apim.gdpr.client.internal.dao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.gdpr.client.exceptions.GDPRClientException;
import org.wso2.analytics.apim.gdpr.client.internal.util.QueryManager;
import org.wso2.carbon.database.query.manager.config.Queries;
import org.wso2.carbon.database.query.manager.exception.QueryMappingNotAvailableException;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.datasource.core.exception.DataSourceException;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_USERNAME_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.PSEUDONYM_USERNAME_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TABLE_CHECK_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TABLE_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TENANT_DOMAIN_COLUMN_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TENANT_DOMAIN_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client
        .GDPRClientConstants.UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_DOMAIN_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.USERNAME_COLUMN_NAME_PLACEHOLDER;

/**
 * DAO class for GDPR Client.
 */
public class ClientDAO {
    private static final Logger LOG = LoggerFactory.getLogger(ClientDAO.class);

    private DataSourceService dataSourceService;
    private QueryManager queryManager;
    private DataSource dataSource;
    private String databaseName;
    private List<Queries> deploymentQueries;

    public ClientDAO(DataSourceService dataSourceService, String databaseName, List<Queries> deploymentQueries) {
        this.dataSourceService = dataSourceService;
        this.databaseName = databaseName;
        this.deploymentQueries = deploymentQueries;
    }

    public void init() throws GDPRClientException {
        try (Connection conn = getConnection()) {
            DatabaseMetaData databaseMetaData = conn.getMetaData();
            this.queryManager = new QueryManager(databaseMetaData.getDatabaseProductName(),
                    databaseMetaData.getDatabaseProductVersion(), this.deploymentQueries);
        } catch (SQLException | IOException | QueryMappingNotAvailableException e) {
            throw new GDPRClientException("Error initializing connection.", e);
        }
    }

    /**
     * Method for checking whether or not the given table exists.
     *
     * @param tableName name of the table
     * @return true/false based on the table existence.
     */
    public boolean checkTableExists(String tableName) {
        String query = this.queryManager.getQuery(TABLE_CHECK_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName);
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            try (ResultSet rs = ps.executeQuery()) {
                return true;
            }
        } catch (SQLException | GDPRClientException e) {
            LOG.debug("Table '{}' assumed to not exist since its existence check query {} resulted "
                    + "in exception {}.", tableName, query, e.getMessage());
        }
        return false;
    }

    /**
     * Updates a given table row with the provided pseudonym for the tenant domain included
     * username(ex:admin@carbon.super) with the where clause defined with tenant domain.
     *
     * @param tableName name of the table
     * @return boolean returns whether the update is successful
     * @throws GDPRClientException throws when an error occurred while performing update query
     */
    public boolean updateTenantDomainIncludedUsernameWithTenantDomainTableEntry(String tableName,
                                                                             String usernameColumnName,
                                                                             String usernameWithTenantDomain,
                                                                             String pseudonymWithTenantDomain,
                                                                             String tenantDomainColumnName,
                                                                             String tenantDomain)
            throws GDPRClientException {
        boolean result;
        String query = this.queryManager.getQuery(UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_DOMAIN_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName)
                .replace(USERNAME_COLUMN_NAME_PLACEHOLDER, usernameColumnName)
                .replace(CURRENT_USERNAME_VALUE_PLACEHOLDER, usernameWithTenantDomain)
                .replace(PSEUDONYM_USERNAME_VALUE_PLACEHOLDER, pseudonymWithTenantDomain)
                .replace(TENANT_DOMAIN_COLUMN_NAME_PLACEHOLDER, tenantDomainColumnName)
                .replace(TENANT_DOMAIN_VALUE_PLACEHOLDER, tenantDomain);
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            conn.setAutoCommit(false);
            if (LOG.isDebugEnabled()) {
                LOG.debug("Executing query: " + query);
            }
            result = ps.executeUpdate() == 1;
            conn.commit();
        } catch (SQLException e) {
            throw new GDPRClientException("Error occurred while performing the update. [Query=" + query + "]", e);
        }
        return result;
    }

    private DataSource getDataSource() throws GDPRClientException {
        if (this.dataSource != null) {
            return this.dataSource;
        }

        if (this.dataSourceService == null) {
            throw new GDPRClientException("Datasource service is null. Cannot retrieve datasource '"
                    + this.databaseName + "'.");
        }

        try {
            this.dataSource = (DataSource) this.dataSourceService.getDataSource(this.databaseName);
        } catch (DataSourceException e) {
            throw new GDPRClientException("Unable to retrieve the datasource: '" + this.databaseName + "'.", e);
        }
        return this.dataSource;
    }

    private Connection getConnection() throws SQLException, GDPRClientException {
        return getDataSource().getConnection();
    }

    public String getDatabaseName() {
        return this.databaseName;
    }
}
