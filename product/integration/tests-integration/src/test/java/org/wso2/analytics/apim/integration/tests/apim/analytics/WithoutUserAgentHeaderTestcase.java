/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.analytics.apim.integration.tests.apim.analytics;

import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import org.apache.axis2.context.ConfigurationContext;
import org.apache.axis2.context.ConfigurationContextFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceStub;

public class WithoutUserAgentHeaderTestcase extends APIMAnalyticsBaseTestCase {

    public static final String UNKNOWN = "UNKNOWN";
    private AnalyticsProcessorAdminServiceStub analyticsStub;
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";

    @BeforeClass (alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA);
        }
        if(isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_DATA)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_DATA);
        }
        if(isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_SUMMARY)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_SUMMARY);
        }
        initializeStub();
    }

    @AfterClass (alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA);
        }
        if(isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_DATA)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_DATA);
        }
        if(isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_SUMMARY)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.USER_AGENT_SUMMARY);
        }

    }


    @Test (groups = "wso2.analytics.apim", description = "Tests if the data entered properly without user agent "
            + "header")
    public void testAddingWithoutUserAgentHeader() throws Exception {
        String query = "CREATE TEMPORARY TABLE API_REQUEST_USER_BROWSER_SUMMARY_FINAL USING CarbonAnalytics OPTIONS (tableName \"API_REQ_USER_BROW_SUMMARY\",\n"
                + "    schema \"api string -i,\n" + "    version string -i,\n" + "    apiPublisher string -i,\n"
                + "    tenantDomain string -i,\n" + "    total_request_count int -i,\n" + "    year int -i,\n"
                + "    month int -i,\n" + "    day int -i,\n" + "    requestTime long -i,\n" + "    os string -i,\n"
                + "    browser string -i,\n" + "    key_os_browser_facet facet -i\",\n"
                + "    primaryKeys \"api,version,apiPublisher,year,month,day,os,browser,tenantDomain\"\n" + "    )";
        this.analyticsStub.execute(query);
        String query1 = "insert INTO table API_REQUEST_USER_BROWSER_SUMMARY_FINAL select \"test\",\"1.0.0\", "
                + "\"samplePublisher\", \"carbon.super\"," + 1 + "," + 2017 + "," + 1 + "," + 25 + "," + 123456789 +
                "," + null  + "," + null + "," + null;
        this.analyticsStub.execute(query1);

        String query2 = "CREATE TEMPORARY TABLE APIUserBrowserData USING CarbonJDBC OPTIONS (dataSource \"WSO2AM_STATS_DB\", tableName \"API_REQ_USER_BROW_SUMMARY\",schema \"api STRING ,version STRING ,apiPublisher STRING ,tenantDomain STRING ,total_request_count INTEGER ,year INTEGER ,month INTEGER ,day INTEGER ,requestTime LONG ,os STRING , browser STRING\",primaryKeys\"api,version,apiPublisher,year,month,day,os,browser,tenantDomain\");";

        this.analyticsStub.executeQuery(query2);
        String query3 = "INSERT INTO TABLE APIUserBrowserData SELECT api,version,apiPublisher,tenantDomain,total_request_count,year,month,day,requestTime, if(os is null, \"UNKNOWN\", os), if(browser is null, \"UNKNOWN\", browser)  FROM API_REQUEST_USER_BROWSER_SUMMARY_FINAL;";

        this.analyticsStub.executeQuery(query3);
        String query4 = "select * from APIUserBrowserData where os=\"UNKNOWN\"";
        AnalyticsProcessorAdminServiceStub.AnalyticsQueryResultDto[] resultArr = this.analyticsStub.execute(query4);
        AnalyticsProcessorAdminServiceStub.AnalyticsQueryResultDto result = resultArr[resultArr.length - 1];
        AnalyticsProcessorAdminServiceStub.AnalyticsRowResultDto[] rows = result.getRowsResults();
        Assert.assertEquals(rows[0].getColumnValues()[9], UNKNOWN);
        Assert.assertEquals(rows[0].getColumnValues()[10], UNKNOWN);
    }


    private void initializeStub() throws Exception {
        ConfigurationContext cCtx = ConfigurationContextFactory.
                createConfigurationContextFromFileSystem(null);
        analyticsStub = new AnalyticsProcessorAdminServiceStub(cCtx,
                backendURL + "/services/" + ANALYTICS_SERVICE_NAME);
        ServiceClient client = analyticsStub._getServiceClient();
        Options option = client.getOptions();
        option.setManageSession(true);
        option.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, getSessionCookie());
    }
}
