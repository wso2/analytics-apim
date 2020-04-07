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
package org.wso2.analytics.apim.gdpr.client;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.gdpr.client.bean.DatabaseInfo;
import org.wso2.analytics.apim.gdpr.client.bean.GDPRClientConfiguration;
import org.wso2.analytics.apim.gdpr.client.bean.TableEntryInfo;
import org.wso2.analytics.apim.gdpr.client.bean.User;
import org.wso2.analytics.apim.gdpr.client.exceptions.GDPRClientException;
import org.wso2.analytics.apim.gdpr.client.internal.dao.ClientDAO;
import org.wso2.analytics.apim.gdpr.client.internal.util.ClientUtils;
import org.wso2.carbon.database.query.manager.config.Queries;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.datasource.core.beans.DataSourceMetadata;

import java.util.List;

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.AT;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_IP_USERNAME_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_MAX;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.IP_MIN;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.SUPER_TENANT_DOMAIN;

/**
 * Main class for APIM GDPR client.
 */
public class Executor {

    private static final Logger LOG = LoggerFactory.getLogger(Executor.class);

    private GDPRClientConfiguration gdprClientConfiguration;
    private List<DataSourceMetadata> dataSources;
    private DataSourceService dataSourceService;
    private User user;

    public Executor(GDPRClientConfiguration gdprClientConfiguration, List<DataSourceMetadata> dataSources,
                    DataSourceService dataSourceService, User user) {
        this.gdprClientConfiguration = gdprClientConfiguration;
        this.dataSources = dataSources;
        this.dataSourceService = dataSourceService;
        this.user = user;
    }

    public void execute() throws GDPRClientException {
        String username = this.user.getUsername();
        String pseudonym = this.user.getPseudonym();
        String ipPseudonym = ClientUtils.generateRandomIP(IP_MIN, IP_MAX);
        String tenantDomain = this.user.getTenantDomain();
        String userEmail = this.user.getUserEmail();
        String userIP = this.user.getUserIP();
        boolean isUserInSuperTenantDomain = tenantDomain.equalsIgnoreCase(SUPER_TENANT_DOMAIN);
        String usernameWithTenantDomain = username.concat(AT).concat(tenantDomain);
        String pseudonymWithTenantDomain = pseudonym.concat(AT).concat(tenantDomain);

        List<Queries> deploymentQueries = this.gdprClientConfiguration.getQueries();
        List<DatabaseInfo> databaseInfo = this.gdprClientConfiguration.getDatabases();

        for (DataSourceMetadata dataSource : this.dataSources) {
            String databaseName = dataSource.getName();
            ClientDAO clientDAO = new ClientDAO(this.dataSourceService, databaseName, deploymentQueries);
            clientDAO.init();

            for (DatabaseInfo databaseEntry : databaseInfo) {
                if (databaseEntry.getDatabaseName().equalsIgnoreCase(databaseName)) {
                    List<TableEntryInfo> tableEntryInfo = databaseEntry.getTableEntries();
                    for (TableEntryInfo tableEntry : tableEntryInfo) {
                        String tableName = tableEntry.getTableName();
                        boolean isTableExists = clientDAO.checkTableExists(tableName);
                        if (!isTableExists) {
                            LOG.warn("Skipping table entry update as the table {} does not exists in the database {}.",
                                    tableName, databaseName);
                            continue;
                        }
                        String columnName = tableEntry.getColumnName();
                        boolean isEmailColumn = false;
                        boolean isIPColumn = false;
                        boolean isTextReplace = tableEntry.isTextReplace();
                        GDPRClientConstants.ColumnTypes columnType = tableEntry.getColumnType();

                        if (columnType == GDPRClientConstants.ColumnTypes.EMAIL) {
                            isEmailColumn = true;
                        } else if (columnType == GDPRClientConstants.ColumnTypes.IP) {
                            isIPColumn = true;
                        }

                        if (!isEmailColumn && !isIPColumn) {
                            boolean isSuperTenantUsernameHasTenantDomain
                                    = tableEntry.isSuperTenantUsernameHasTenantDomain();

                            if (!isTextReplace) {
                                /*
                                 * Scenario 1:
                                 * User is in the super tenant space. Super tenant's username is saved without the
                                 * tenant domain.
                                 * ex: admin, usera
                                 * */
                                if (isUserInSuperTenantDomain && !isSuperTenantUsernameHasTenantDomain) {
                                    clientDAO.updateTableEntry(tableName, columnName, username, pseudonym);
                                    continue;
                                }

                                /*
                                 * This method covers two scenarios.
                                 * Scenario 2:
                                 * User is in the super tenant space. Super tenant's username is saved with the
                                 * tenant domain.
                                 * ex: admin@carbon.super, usera@carbon.super
                                 *
                                 * Scenario 3:
                                 * User is not in the super tenant space(is in some other tenant). Other tenant's
                                 * username is saved with the tenant domain.
                                 * ex: admin@abc.com, usera@abc.com
                                 * NOTE: There is no scenario where other tenant's username is saved without the
                                 * tenant domain.
                                 * */
                                clientDAO.updateTableEntry(tableName, columnName, usernameWithTenantDomain,
                                        pseudonymWithTenantDomain);
                                continue;
                            }

                            String preReplaceText = tableEntry.getPreReplaceText();
                            String postReplaceText = tableEntry.getPostReplaceText();

                            /*
                             * This method covers two scenarios.
                             * Scenario 4:
                             * User is in the super tenant space. Super tenant's username is saved with the
                             * tenant domain(ex: admin@carbon.super, usera@carbon.super) with other text in the same
                             * field.
                             * ex: In APIMALLALERT table username is saved like this in the message field ->
                             * "User admin@carbon.super frequently crosses the limit set." So, a string replace is
                             * performed.
                             *
                             * NOTE: There is no scenario to perform string replace for a super tenant's username
                             * which does not append super tenant domain.
                             *
                             * Scenario 5:
                             * User is not in the super tenant space(is in some other tenant). Other tenant's
                             * username is saved with the tenant domain.
                             * ex: admin@abc.com, usera@abc.com
                             * NOTE: There is no scenario where other tenant's username is saved without the
                             * tenant domain.
                             * */
                            if (isUserInSuperTenantDomain && isSuperTenantUsernameHasTenantDomain) {
                                String currentValue
                                        = preReplaceText.concat(usernameWithTenantDomain).concat(postReplaceText);
                                String replaceValue
                                        = preReplaceText.concat(pseudonymWithTenantDomain).concat(postReplaceText);
                                // perform string replace to replace user ip address
                                clientDAO.performStringReplaceAndUpdateTableEntry(tableName, columnName,
                                        currentValue, replaceValue);
                                continue;
                            }

                            throw new GDPRClientException("Could not find a relevant update query for table " +
                                    "entry: [" + tableEntry.toString() + "] in database: " + databaseName + ".");
                        }

                        if (!isIPColumn) {
                            /*
                             * Scenario 6:
                             * Replace the email stored in the emails field.
                             * ex: In APIMALERTSTAKEHOLDERINFO table emails are stored like this ->
                             * "user1@abc.com, user2@abc.com, user3@abc.com". In here we need to do perform a
                             * string replace to replace the email value with the pseudonym value.
                             * NOTE: This scenario is a special case where it only applicable for APIMALLALERT
                             * table.
                             * */
                            if (isTextReplace) {
                                // skip update query for email entries if user email is not provided
                                if (StringUtils.isEmpty(userEmail)) {
                                    LOG.warn("Skipping update for table entry: [" + tableEntry.toString() + "] in " +
                                            "database: " + databaseName + " as the user email is not provided.");
                                    continue;
                                }
                                String preReplaceText = tableEntry.getPreReplaceText();
                                String postReplaceText = tableEntry.getPostReplaceText();
                                // perform string replace to replace user email value
                                clientDAO.performStringReplaceAndUpdateEmailTableEntry(tableName, columnName,
                                        userEmail, pseudonym, preReplaceText, postReplaceText);
                                continue;
                            }

                            /*
                             * NOTE: There is no scenario like following. Hence, not implemented.
                             * Replace the email stored in the email field. In this scenario only one email entry is
                             * stored.(unlike multiple emails in the same field in scenario 6)
                             * */
                            throw new GDPRClientException("Could not find a relevant update query for table " +
                                    "entry: [" + tableEntry.toString() + "] in database: " + databaseName + ".");
                        }

                        /*
                         * Scenario 7:
                         * Replace the ip address and username stored in the message field.
                         * ex: In APIMALLALERT table, ip address is stored like this ->
                         * "A request from a old IP (127.0.0.1) detected by user:john@abc.com using
                         * application:DefaultApplication owned by george@abc.com.". In here we need to do perform a
                         * string replace to replace the ip address and the username with the pseudonym value. If IP
                         * is not provided, then only username will be replaced.
                         * NOTE: This scenario is a special case where it only applicable for APIMALLALERT table.
                         * */
                        if (isTextReplace) {
                            String preReplaceText = tableEntry.getPreReplaceText();
                            String postReplaceText = tableEntry.getPostReplaceText();
                            if (StringUtils.isEmpty(userIP)) {
                                // replace only the username as the user ip is not provided.
                                LOG.warn("Updating only USERNAME for table entry: [" + tableEntry.toString() + "] in " +
                                        "database: " + databaseName + " as the user ip is not provided.");
                                String currentValue = postReplaceText.replace(CURRENT_IP_USERNAME_VALUE_PLACEHOLDER,
                                        usernameWithTenantDomain);
                                String replaceValue = postReplaceText.replace(CURRENT_IP_USERNAME_VALUE_PLACEHOLDER,
                                        pseudonymWithTenantDomain);
                                // perform string replace to replace user ip address
                                clientDAO.performStringReplaceAndUpdateTableEntry(tableName, columnName,
                                        currentValue, replaceValue);
                                continue;
                            }
                            String currentValue = preReplaceText.concat(userIP).concat(postReplaceText)
                                    .replace(CURRENT_IP_USERNAME_VALUE_PLACEHOLDER, usernameWithTenantDomain);
                            String replaceValue = preReplaceText.concat(ipPseudonym).concat(postReplaceText)
                                    .replace(CURRENT_IP_USERNAME_VALUE_PLACEHOLDER, pseudonymWithTenantDomain);
                            // perform string replace to replace user ip address
                            clientDAO.performStringReplaceAndUpdateTableEntry(tableName, columnName, currentValue,
                                    replaceValue);
                            continue;
                        }

                        /*
                         * Scenario 8:
                         * Replace the ip address stored in a ip address field. In this scenario only one ip address
                         * entry is stored.(unlike within a message with other texts in scenario 7) In this scenario
                         * username associated to the IP also replaced with the pseudonym value. IF value for user
                         * IP is not given, only the username will be replaced.
                         * */
                        String ipUsernameColumnName = tableEntry.getIpUsernameColumnName();
                        if (StringUtils.isEmpty(userIP)) {
                            // replace only the username as the user ip is not provided.
                            LOG.warn("Updating only USERNAME for table entry: [" + tableEntry.toString() + "] in " +
                                    "database: " + databaseName + " as the user ip is not provided.");
                            clientDAO.updateTableEntry(tableName, ipUsernameColumnName, usernameWithTenantDomain,
                                    pseudonymWithTenantDomain);
                            continue;
                        }
                        clientDAO.updateIPAndUsernameInTableEntry(tableName, columnName, ipUsernameColumnName,
                                userIP, usernameWithTenantDomain, ipPseudonym, pseudonymWithTenantDomain);
                    }
                    break;
                }
            }
        }
    }
}
