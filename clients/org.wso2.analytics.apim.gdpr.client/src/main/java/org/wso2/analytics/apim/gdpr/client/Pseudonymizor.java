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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.gdpr.client.bean.DatabaseInfo;
import org.wso2.analytics.apim.gdpr.client.bean.GDPRClientConfiguration;
import org.wso2.analytics.apim.gdpr.client.bean.TableEntryInfo;
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

/**
 * Main class for APIM GDPR client.
 */
public class Pseudonymizor {

    private static final Logger logger = LoggerFactory.getLogger(Pseudonymizor.class);
    private static final String CONF_FOLDER = "conf";
    private static final String FILE_NAME = "deployment.yaml";

    public static void main(String[] args) {
        Path deploymentConfigPath = Paths.get(CONF_FOLDER, FILE_NAME);

        try {
            ConfigProvider configProvider = ConfigProviderFactory.getConfigProvider(deploymentConfigPath);
            GDPRClientConfiguration gdprClientConfiguration = configProvider
                    .getConfigurationObject(GDPRClientConfiguration.class);
            String username = gdprClientConfiguration.getUsername();
            String pseudonym = gdprClientConfiguration.getSaltValue();
            String tenantDomain = gdprClientConfiguration.getTenantDomain();
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
                                logger.warn("Table {} does not exists in the database {}.",
                                        gdprClientConfiguration, databaseName);
                                break;
                            }
                            String columnName = tableEntry.getColumnName();
                            boolean isUsernameWithTenantDomain = tableEntry.isUsernameWithTenantDomain();
                            String tenantDomainColumnName = tableEntry.getTenantDomainColumnName();
                            if (isUsernameWithTenantDomain) {
                                clientDAO.updateTenantDomainIncludedUsernameWithTenantDomainTableEntry(
                                        tableName,
                                        columnName,
                                        usernameWithTenantDomain,
                                        pseudonymWithTenantDomain,
                                        tenantDomainColumnName,
                                        tenantDomain
                                );
                            }
                        }
                        break;
                    }
                }
            }
        } catch (ConfigurationException e) {
            logger.error("Error in getting configuration", e);
        } catch (DataSourceException e) {
            logger.error("Error occurred while initialising data sources.", e);
        }
    }
}
