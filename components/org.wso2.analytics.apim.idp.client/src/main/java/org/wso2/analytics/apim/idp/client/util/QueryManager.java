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
package org.wso2.analytics.apim.idp.client.util;

import org.wso2.carbon.database.query.manager.QueryProvider;
import org.wso2.carbon.database.query.manager.config.Queries;
import org.wso2.carbon.database.query.manager.exception.QueryMappingNotAvailableException;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.CustomClassLoaderConstructor;
import org.yaml.snakeyaml.introspector.BeanAccess;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;

/**
 * Query Manager.
 */
public class QueryManager {

    private static final String DB2_DB_TYPE = "DB2";
    private static final String FILE_SQL_QUERIES = "queries.yaml";

    private Map<String, String> queries;
    private ArrayList<Queries> deploymentQueries;

    public QueryManager(String databaseType, String databaseVersion, ArrayList<Queries> deploymentQueries)
            throws QueryMappingNotAvailableException, IOException {
        this.deploymentQueries = deploymentQueries;
        this.queries = readConfigs(databaseType, databaseVersion);
    }

    public Map<String, String> readConfigs(String databaseType, String databaseVersion)
            throws QueryMappingNotAvailableException, IOException {
        try {
            ArrayList<Queries> componentQueries;
            URL url = this.getClass().getClassLoader().getResource(FILE_SQL_QUERIES);
            if (url != null) {
                ApimIdPClientConfiguration apimIdPClientConfiguration = readYamlContent(url.openStream());
                componentQueries = apimIdPClientConfiguration.getQueries();
            } else {
                throw new RuntimeException("Unable to load " + FILE_SQL_QUERIES + " file.");
            }
            // DB2 product name changes with the specific versions(For an example DB2/LINUXX8664, DB2/NT). Hence, checks
            // whether the product name contains "DB2".
            if (databaseType.toLowerCase(Locale.ENGLISH).contains(DB2_DB_TYPE.toLowerCase(Locale.ENGLISH))) {
                databaseType = DB2_DB_TYPE;
            }
            return QueryProvider.mergeMapping(databaseType, databaseVersion, componentQueries, this.deploymentQueries);
        } catch (QueryMappingNotAvailableException e) {
            throw new QueryMappingNotAvailableException("Unable to load queries.", e);
        } catch (IOException e) {
            throw new IOException("Unable to load content from " + FILE_SQL_QUERIES + " file.", e);
        }
    }

    public String getQuery(String key) {
        if (!this.queries.containsKey(key)) {
            throw new RuntimeException("Unable to find the configuration entry for the key: " + key);
        }
        return this.queries.get(key);
    }

    private ApimIdPClientConfiguration readYamlContent(InputStream yamlContent) {
        Yaml yaml = new Yaml(new CustomClassLoaderConstructor(ApimIdPClientConfiguration.class,
                ApimIdPClientConfiguration.class.getClassLoader()));
        yaml.setBeanAccess(BeanAccess.FIELD);
        return yaml.loadAs(yamlContent, ApimIdPClientConfiguration.class);
    }
}
