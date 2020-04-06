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
import org.wso2.analytics.apim.gdpr.client.exceptions.GDPRClientException;
import org.wso2.analytics.apim.gdpr.client.internal.dao.ClientDAO;
import org.wso2.carbon.config.ConfigProviderFactory;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.database.query.manager.config.Queries;
import org.wso2.carbon.datasource.core.DataSourceManager;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.datasource.core.beans.DataSourceMetadata;
import org.wso2.carbon.datasource.core.beans.DataSourcesConfiguration;
import org.wso2.carbon.datasource.core.exception.DataSourceException;
import org.wso2.carbon.datasource.core.impl.DataSourceServiceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.AT;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CONF_FOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CURRENT_IP_USERNAME_VALUE_PLACEHOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.FILE_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.SUPER_TENANT_DOMAIN;

/**
 * Main class for APIM GDPR client.
 */
public class Pseudonymizor {

    private static final Logger LOG = LoggerFactory.getLogger(Pseudonymizor.class);


    public static void main(String[] args) {
        Path deploymentConfigPath = Paths.get(CONF_FOLDER, FILE_NAME);

        try {
            ConfigProvider configProvider = ConfigProviderFactory.getConfigProvider(deploymentConfigPath);
            GDPRClientConfiguration gdprClientConfiguration = configProvider
                    .getConfigurationObject(GDPRClientConfiguration.class);
            // TODO: Add null and empty checks for required fields read as command line arguments
            String username = gdprClientConfiguration.getUsername();
            String pseudonym = gdprClientConfiguration.getPseudonym();
            String ipPseudonym = pseudonym;
            String tenantDomain = gdprClientConfiguration.getTenantDomain();
            String userEmail = gdprClientConfiguration.getUserEmail();
            String userIP = gdprClientConfiguration.getUserIP();
            //TODO: generate random ip which is not in the acceptable range
            boolean isUserInSuperTenantDomain = tenantDomain.equalsIgnoreCase(SUPER_TENANT_DOMAIN);
            String usernameWithTenantDomain = username.concat(AT).concat(tenantDomain);
            String pseudonymWithTenantDomain = pseudonym.concat(AT).concat(tenantDomain);
            DataSourcesConfiguration dataSourcesConfiguration
                    = configProvider.getConfigurationObject(DataSourcesConfiguration.class);
            List<DataSourceMetadata> dataSources = dataSourcesConfiguration.getDataSources();

            DataSourceManager dataSourceManager = DataSourceManager.getInstance();
            DataSourceService dataSourceService = new DataSourceServiceImpl();

            // load and initialize the data sources defined in configuration file
            dataSourceManager.initDataSources(configProvider);

            List<Queries> deploymentQueries = gdprClientConfiguration.getQueries();
            List<DatabaseInfo> databaseInfo = gdprClientConfiguration.getDatabases();

            for (DataSourceMetadata dataSource : dataSources) {
                String databaseName = dataSource.getName();
                ClientDAO clientDAO = new ClientDAO(dataSourceService, databaseName, deploymentQueries);
                clientDAO.init();

                for (DatabaseInfo databaseEntry: databaseInfo) {
                    if (databaseEntry.getDatabaseName().equalsIgnoreCase(databaseName)) {
                        List<TableEntryInfo> tableEntryInfo = databaseEntry.getTableEntries();
                        for (TableEntryInfo tableEntry : tableEntryInfo) {
                            String tableName = tableEntry.getTableName();
                            boolean isTableExists = clientDAO.checkTableExists(tableName);
                            if (!isTableExists) {
                                LOG.warn("Table {} does not exists in the database {}.", tableName, databaseName);
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
                                // replace only the username as the user ip is not provided.
                                if (StringUtils.isEmpty(userIP)) {
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
        } catch (ConfigurationException e) {
            LOG.error("Error in getting configuration", e);
        } catch (DataSourceException e) {
            LOG.error("Error occurred while initialising data sources.", e);
        } catch (GDPRClientException e) {
            LOG.error("Error occurred while updating the table entries.", e);
        }
    }
}
