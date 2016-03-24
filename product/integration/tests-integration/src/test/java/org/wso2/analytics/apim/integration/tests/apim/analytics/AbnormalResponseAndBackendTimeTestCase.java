/*
*  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  WSO2 Inc. licenses this file to you under the Apache License,
*  Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License.
*  You may obtain a copy of the License at
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
package org.wso2.analytics.apim.integration.tests.apim.analytics;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

public class AbnormalResponseAndBackendTimeTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(AbnormalResponseAndBackendTimeTestCase.class);

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.response";
    private final String STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "abnormalResponseAndBackendTime";
    private final String ABNORMAL_RESPONSE_TIME_PUBLISHER_FILE = "logger_abnormalResponseTime.xml";
    private final String ABNORMAL_BACKEND_TIME_PUBLISHER_FILE = "logger_abnormalBackendTime.xml";
    private final String SPARK_SCRIPT = "org_wso2_analytics_apim_response_stat_generator";
    private final String RESPONSE_PERCENTILE_TABLE = "ORG_WSO2_ANALYTICS_APIM_RESPONSEPERCENTILE";
    private final int MAX_TRIES = 5;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, RESPONSE_PERCENTILE_TABLE)) {
            deleteData(-1234, RESPONSE_PERCENTILE_TABLE);
        }
        // deploy the publisher xml files
        deployPublisher(TEST_RESOURCE_PATH, ABNORMAL_BACKEND_TIME_PUBLISHER_FILE);
        deployPublisher(TEST_RESOURCE_PATH, ABNORMAL_RESPONSE_TIME_PUBLISHER_FILE);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, RESPONSE_PERCENTILE_TABLE)) {
            deleteData(-1234, RESPONSE_PERCENTILE_TABLE);
        }
        // undeploy the publishers
        undeployPublisher(ABNORMAL_BACKEND_TIME_PUBLISHER_FILE);
        undeployPublisher(ABNORMAL_RESPONSE_TIME_PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testResponseStatGeneratorSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), "org_wso2_analytics_apim_response_stat_generator spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testResponseStatGeneratorSparkScriptDeployment")
    public void testResponseSimulationDataSent() throws Exception {

        long initialResponseEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));

        //publish events
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 100);

        int i = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            long currentResponseEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));
            eventsPublished = (currentResponseEventCount - initialResponseEventCount == 11);
            if (eventsPublished) {
                break;
            }
            i++;
        }

        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test org_wso2_analytics_apim_response_stat_generator Spark Script execution"
            , dependsOnMethods = "testResponseSimulationDataSent")
    public void testResponseStatGeneratorSparkScriptExecution() throws Exception {
        //run the script
        executeSparkScript(SPARK_SCRIPT);
        int i = 0;
        boolean scriptExecuted = false;
        while (i < MAX_TRIES) {
            Thread.sleep(10000);
            long percentileTableCount = getRecordCount(-1234, RESPONSE_PERCENTILE_TABLE);
            scriptExecuted = (percentileTableCount == 5);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted, "Spark script did not execute as expected!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal ResponseTime Alert",
            dependsOnMethods = "testResponseStatGeneratorSparkScriptExecution")
    public void testAbnormalResponseTimeAlert() throws Exception {
        int initialCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/calc/1.0", "CalculatorAPI:v1.0", "CalculatorAPI",
                        "/add?x=12&y=3", "/add", "GET", "1.0", "1", "220", "7", "5", "admin@carbon.super", "1456894602386", "carbon.super",
                        "192.168.66.1", "admin@carbon.super", "DefaultApplication", "1", "False", "0", "https-8243", "200"}
        );
        publishEvent(eventDto);
        Thread.sleep(4000);

        boolean abnormalResponseTimeAlertTriggered = isAlertReceived(initialCount, "Unique ID: logger_abnormalResponseTime");
        Assert.assertTrue(abnormalResponseTimeAlertTriggered, "Abnormal ResponseTime Alert event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal BackendTime Alert",
            dependsOnMethods = "testResponseStatGeneratorSparkScriptExecution")
    public void testAbnormalBackendTimeAlert() throws Exception {
        int initialCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/calc/1.0", "CalculatorAPI:v2.0", "CalculatorAPI",
                        "/add?x=12&y=3", "/add", "GET", "1.0", "1", "12", "7", "165", "admin@carbon.super", "1456894602386",
                        "carbon.super", "192.168.66.1", "admin@carbon.super", "DefaultApplication", "1", "False", "0", "https-8243", "200"}
        );
        publishEvent(eventDto);
        Thread.sleep(4000);

        boolean abnormalBackendTimeAlertTriggered = isAlertReceived(initialCount, "Unique ID: logger_abnormalBackendTime");
        Assert.assertTrue(abnormalBackendTimeAlertTriggered, "Abnormal BackendTime Alert event not received!");
    }

}
