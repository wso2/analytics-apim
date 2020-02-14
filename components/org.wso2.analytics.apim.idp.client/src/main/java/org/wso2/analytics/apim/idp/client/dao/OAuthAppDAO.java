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
package org.wso2.analytics.apim.idp.client.dao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.idp.client.ApimIdPClientConstants;
import org.wso2.analytics.apim.idp.client.dto.DCRClientResponse;
import org.wso2.analytics.apim.idp.client.util.QueryManager;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;
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
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.TimeZone;
import javax.sql.DataSource;

import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.OAUTHAPP_TABLE_CONSUMER_KEY_COLUMN;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.OAUTHAPP_TABLE_CONSUMER_SECRET_COLUMN;

/**
 * DAO class for Oauth App data.
 */
public class OAuthAppDAO {
    private static final Logger LOG = LoggerFactory.getLogger(OAuthAppDAO.class);

    private DataSourceService dataSourceService;
    private QueryManager queryManager;
    private DataSource dataSource;
    private String databaseName;
    private ArrayList<Queries> deploymentQueries;

    public OAuthAppDAO(DataSourceService dataSourceService, String databaseName,
                       ArrayList<Queries> deploymentQueries) {
        this.dataSourceService = dataSourceService;
        this.databaseName = databaseName;
        this.deploymentQueries = deploymentQueries;
    }

    public void init() throws IdPClientException {
        try (Connection conn = getConnection()) {
            DatabaseMetaData databaseMetaData = conn.getMetaData();
            this.queryManager = new QueryManager(databaseMetaData.getDatabaseProductName(),
                    databaseMetaData.getDatabaseProductVersion(), this.deploymentQueries);
        } catch (SQLException | IOException | QueryMappingNotAvailableException e) {
            throw new IdPClientException("Error initializing connection.", e);
        }
    }

    /**
     * Method for checking whether or not the given table (which reflects the current event table instance) exists.
     *
     * @return true/false based on the table existence.
     */
    public boolean systemAppsTableExists() {
        String query = this.queryManager.getQuery(ApimIdPClientConstants.OAUTH_APP_TABLE_CHECK);
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            try (ResultSet rs = ps.executeQuery()) {
                return true;
            }
        } catch (SQLException | IdPClientException e) {
            LOG.debug("Table '{}' assumed to not exist since its existence check query {} resulted "
                    + "in exception {}.", ApimIdPClientConstants.OAUTHAPP_TABLE, query, e.getMessage());
            return false;
        }
    }

    public OAuthApplicationInfo getOAuthApp(String name, String tenantDomain) throws IdPClientException {
        String query = this.queryManager.getQuery(ApimIdPClientConstants.RETRIEVE_OAUTH_APP_TEMPLATE);
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setString(1, name);
            ps.setString(2, tenantDomain);
            if (LOG.isDebugEnabled()) {
                LOG.debug("Executing query: " + query);
            }
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new OAuthApplicationInfo(name, rs.getString(OAUTHAPP_TABLE_CONSUMER_KEY_COLUMN),
                            rs.getString(OAUTHAPP_TABLE_CONSUMER_SECRET_COLUMN));
                }
            }
        } catch (SQLException e) {
            throw new IdPClientException("Unable to retrieve OAuthApp. [Query=" + query + "]", e);
        }
        return null;
    }

    public void insertSystemApp(DCRClientResponse dcrClientResponse, String clientName, String tenantDomain)
            throws IdPClientException {
        String query = this.queryManager.getQuery(ApimIdPClientConstants.INSERT_SYSTEM_APP);
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setString(1, clientName);
            ps.setString(2, dcrClientResponse.getClientId());
            ps.setString(3, dcrClientResponse.getClientSecret());
            ps.setString(4, tenantDomain);
            ps.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()),
                    Calendar.getInstance(TimeZone.getTimeZone("UTC")));
            if (LOG.isDebugEnabled()) {
                LOG.debug("Executing query: " + query);
            }
            ps.executeUpdate();
            conn.commit();
        } catch (SQLException e) {
            throw new IdPClientException("Unable to write into AM_SYSTEM_APPS. [Query=" + query + "]", e);
        }
    }

    private DataSource getDataSource() throws IdPClientException {
        if (this.dataSource != null) {
            return this.dataSource;
        }

        if (this.dataSourceService == null) {
            throw new IdPClientException("Datasource service is null. Cannot retrieve datasource '"
                    + this.databaseName + "'.");
        }

        try {
            this.dataSource = (DataSource) this.dataSourceService.getDataSource(this.databaseName);
        } catch (DataSourceException e) {
            throw new IdPClientException("Unable to retrieve the datasource: '" + this.databaseName + "'.", e);
        }
        return this.dataSource;
    }

    private Connection getConnection() throws SQLException, IdPClientException {
        return getDataSource().getConnection();
    }

    public String getDatabaseName() {
        return this.databaseName;
    }
}
