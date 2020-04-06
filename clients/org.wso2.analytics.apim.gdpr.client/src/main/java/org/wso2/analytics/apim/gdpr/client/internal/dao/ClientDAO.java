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

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.COLUMN_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_IP_USERNAME_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_IP_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_AND_USERNAME_UPDATE_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_COLUMN_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_PSEUDONYM_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_USERNAME_COLUMN_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.POST_REPLACE_TEXT_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.PRE_REPLACE_TEXT_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.PSEUDONYM_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.REPLACE_AND_UPDATE_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.REPLACE_EMAIL_AND_UPDATE_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.REPLACE_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TABLE_CHECK_QUERY;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.TABLE_NAME_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.UPDATE_QUERY;

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
     * Updates the table entry with the provided pseudonym for the username or email.
     *
     * @param tableName name of the table
     * @param columnName name of the column which contains the username/email value in the table
     * @param currentValue current value for username or email
     * @param pseudonym pseudonym value which will be used to replace the username or email
     * @return boolean returns whether the update is successful
     * @throws GDPRClientException throws when an error occurred while performing update query
     */
    public boolean updateTableEntry(String tableName, String columnName, String currentValue, String pseudonym)
            throws GDPRClientException {
        boolean result;
        String query = this.queryManager.getQuery(UPDATE_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName)
                .replace(COLUMN_NAME_PLACEHOLDER, columnName)
                .replace(CURRENT_VALUE_PLACEHOLDER, currentValue)
                .replace(PSEUDONYM_VALUE_PLACEHOLDER, pseudonym);
        result = executeUpdateQuery(tableName, query);
        return result;
    }

    /**
     * Updates the table entry with the provided pseudonym for the IP address and the username.
     *
     * @param tableName name of the table
     * @param ipColumnName name of the column which contains the ip address in the table
     * @param usernameColumn name of the column which contains the username value in the table
     * @param currentIpValue current value stored for ip address
     * @param currentUsernameValue current value stored for the username
     * @param pseudonym pseudonym value which will be used to replace the username or email
     * @return boolean returns whether the update is successful
     * @throws GDPRClientException throws when an error occurred while performing update query
     */
    public boolean updateIPAndUsernameInTableEntry(String tableName, String ipColumnName, String usernameColumn,
                                                   String currentIpValue, String currentUsernameValue, String pseudonym,
                                                   String pseudonymWithTenantDomain) throws GDPRClientException {
        boolean result;
        String query = this.queryManager.getQuery(IP_AND_USERNAME_UPDATE_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName)
                .replace(IP_COLUMN_NAME_PLACEHOLDER, ipColumnName)
                .replace(IP_USERNAME_COLUMN_NAME_PLACEHOLDER, usernameColumn)
                .replace(CURRENT_IP_VALUE_PLACEHOLDER, currentIpValue)
                .replace(CURRENT_IP_USERNAME_VALUE_PLACEHOLDER, currentUsernameValue)
                .replace(IP_PSEUDONYM_VALUE_PLACEHOLDER, pseudonym)
                .replace(PSEUDONYM_VALUE_PLACEHOLDER, pseudonymWithTenantDomain);
        result = executeUpdateQuery(tableName, query);
        return result;
    }

    /**
     * Updates the table entry by performing a string replace for the provided value.
     * ex: If the email is included in an alert message, this method replaces the email in that message with the
     * provided pseudonym.
     *
     * @param tableName name of the table
     * @param columnName name of the column which contains the email value in the table
     * @param currentValue current value for email
     * @param pseudonym pseudonym value which will be used to replace the email
     * @param preReplaceText text which needs to be appended(to sql query) before the replacing value
     * @param postReplaceText text which needs to be appended(to sql query) after the replacing value
     * @return boolean returns whether the update is successful
     * @throws GDPRClientException throws when an error occurred while performing update query
     */
    public boolean performStringReplaceAndUpdateEmailTableEntry(String tableName, String columnName,
                                                                String currentValue, String pseudonym,
                                                                String preReplaceText, String postReplaceText)
            throws GDPRClientException {
        boolean result;
        String query = this.queryManager.getQuery(REPLACE_EMAIL_AND_UPDATE_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName)
                .replace(COLUMN_NAME_PLACEHOLDER, columnName)
                .replace(PRE_REPLACE_TEXT_VALUE_PLACEHOLDER, preReplaceText)
                .replace(CURRENT_VALUE_PLACEHOLDER, currentValue)
                .replace(POST_REPLACE_TEXT_VALUE_PLACEHOLDER, postReplaceText)
                .replace(PSEUDONYM_VALUE_PLACEHOLDER, pseudonym);
        result = executeUpdateQuery(tableName, query);
        return result;
    }

    /**
     * Updates the table entry by performing a string replace for the provided current value with replace value.
     *
     * @param tableName name of the table
     * @param columnName name of the column which contains the current value string in the table
     * @param currentValue current value
     * @param replaceValue replace value
     * @return boolean returns whether the update is successful
     * @throws GDPRClientException throws when an error occurred while performing update query
     */
    public boolean performStringReplaceAndUpdateTableEntry(String tableName, String columnName, String currentValue,
                                                           String replaceValue) throws GDPRClientException {
        boolean result;
        String query = this.queryManager.getQuery(REPLACE_AND_UPDATE_QUERY);
        query = query.replace(TABLE_NAME_PLACEHOLDER, tableName)
                .replace(COLUMN_NAME_PLACEHOLDER, columnName)
                .replace(CURRENT_VALUE_PLACEHOLDER, currentValue)
                .replace(REPLACE_VALUE_PLACEHOLDER, replaceValue);
        result = executeUpdateQuery(tableName, query);
        return result;
    }

    public boolean executeUpdateQuery(String tableName, String query) throws GDPRClientException {
        boolean result;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            conn.setAutoCommit(false);
            if (LOG.isDebugEnabled()) {
                LOG.debug("Executing query: " + query);
            }
            result = ps.executeUpdate() == 1;
            conn.commit();
            LOG.info("Update query successfully executed for table {} of {} database.", tableName, this.databaseName);
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
