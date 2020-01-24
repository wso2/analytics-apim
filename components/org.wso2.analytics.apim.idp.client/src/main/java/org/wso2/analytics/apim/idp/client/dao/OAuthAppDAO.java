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
import java.util.ArrayList;
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

    private static void closeConnection(Connection connection, PreparedStatement preparedStatement,
                                        ResultSet resultSet) {
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                LOG.warn("Error closing database connection", e);
            }
        }

        if (preparedStatement != null) {
            try {
                preparedStatement.close();
            } catch (SQLException e) {
                LOG.warn("Error closing prepared statement.", e);
            }
        }

        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                LOG.warn("Error closing result set.", e);
            }
        }
    }

    public void init() throws IdPClientException {
        Connection conn = null;
        try {
            conn = getConnection();
            DatabaseMetaData databaseMetaData = conn.getMetaData();
            this.queryManager = new QueryManager(databaseMetaData.getDatabaseProductName(),
                    databaseMetaData.getDatabaseProductVersion(), this.deploymentQueries);
        } catch (SQLException | IOException | QueryMappingNotAvailableException e) {
            throw new IdPClientException("Error initializing connection.", e);
        } finally {
            closeConnection(conn, null, null);
        }
    }

    /**
     * Method for checking whether or not the given table (which reflects the current event table instance) exists.
     *
     * @return true/false based on the table existence.
     */
    public boolean tableExists() {
        Connection conn = null;
        PreparedStatement stmt = null;
        String query = null;
        ResultSet rs = null;
        try {
            conn = getConnection();
            query = this.queryManager.getQuery(ApimIdPClientConstants.OAUTH_APP_TABLE_CHECK);
            stmt = conn.prepareStatement(query);
            rs = stmt.executeQuery();
            return true;
        } catch (SQLException | IdPClientException e) {
            LOG.debug("Table '{}' assumed to not exist since its existence check query {} resulted "
                    + "in exception {}.", ApimIdPClientConstants.OAUTHAPP_TABLE, query, e.getMessage());
            return false;
        } finally {
            closeConnection(conn, stmt, rs);
        }
    }

    public OAuthApplicationInfo getOAuthApp(String name) throws IdPClientException {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet resultSet = null;
        String query = this.queryManager.getQuery(ApimIdPClientConstants.RETRIEVE_OAUTH_APP_TEMPLATE);

        try {
            conn = getConnection();
            ps = conn.prepareStatement(query);
            ps.setString(1, name);
            if (LOG.isDebugEnabled()) {
                LOG.debug("Executing query: " + query);
            }
            resultSet = ps.executeQuery();
            if (resultSet.next()) {
                return new OAuthApplicationInfo(name, resultSet.getString(OAUTHAPP_TABLE_CONSUMER_KEY_COLUMN),
                        resultSet.getString(OAUTHAPP_TABLE_CONSUMER_SECRET_COLUMN));
            }
        } catch (SQLException e) {
            throw new IdPClientException("Unable to retrieve OAuthApp. [Query=" + query + "]", e);
        } finally {
            closeConnection(conn, ps, resultSet);
        }
        return null;
    }

    private DataSource getDataSource() throws IdPClientException {
        if (dataSource != null) {
            return dataSource;
        }

        if (dataSourceService == null) {
            throw new IdPClientException("Datasource service is null. Cannot retrieve datasource '"
                    + this.databaseName + "'.");
        }

        try {
            dataSource = (DataSource) dataSourceService.getDataSource(this.databaseName);
        } catch (DataSourceException e) {
            throw new IdPClientException("Unable to retrieve the datasource: '" + this.databaseName + "'.", e);
        }
        return dataSource;
    }

    private Connection getConnection() throws SQLException, IdPClientException {
        return getDataSource().getConnection();
    }

    public String getDatabaseName() {
        return this.databaseName;
    }
}
