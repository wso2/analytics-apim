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

public class AbnormalRequestCountTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(AbnormalRequestCountTestCase.class);

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "abnormalRequestCount";
    private final String PUBLISHER_FILE = "logger_abnormalRequestCount.xml";
    private final String SPARK_SCRIPT = "APIMAnalytics-RequestStatGenerator";
    private final String REQUEST_PERCENTILE_TABLE = "ORG_WSO2_ANALYTICS_APIM_REQUESTPERCENTILE";
    private final String REQUEST_COUNT_PER_MINUTE_TABLE = "ORG_WSO2_ANALYTICS_APIM_REQUESTPERMINSTREAM";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-AbnormalRequestCountDetection";
    private final int MAX_TRIES = 20;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, REQUEST_PERCENTILE_TABLE)) {
            deleteData(-1234, REQUEST_PERCENTILE_TABLE);
        }
        if (isTableExist(-1234, REQUEST_COUNT_PER_MINUTE_TABLE)) {
            deleteData(-1234, REQUEST_COUNT_PER_MINUTE_TABLE);
        }
        // deploy the publisher xml files
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        Thread.sleep(1000);
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, EXECUTION_PLAN_NAME + ".siddhiql"));

    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, REQUEST_PERCENTILE_TABLE)) {
            deleteData(-1234, REQUEST_PERCENTILE_TABLE);
        }
        if (isTableExist(-1234, REQUEST_COUNT_PER_MINUTE_TABLE)) {
            deleteData(-1234, REQUEST_COUNT_PER_MINUTE_TABLE);
        }
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testRequestStatGeneratorSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), "org_wso2_analytics_apim_request_stat_generator spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testRequestStatGeneratorSparkScriptDeployment")
    public void testRequestSimulationDataSent() throws Exception {

        //publish events
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 100);
        Thread.sleep(12000);
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 100);
        Thread.sleep(12000);
        int i = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            long requestPerMinuteEventCount = getRecordCount(-1234, REQUEST_COUNT_PER_MINUTE_TABLE);
            eventsPublished = (requestPerMinuteEventCount >= 4);
            if (eventsPublished) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }

        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test org_wso2_analytics_apim_request_stat_generator Spark Script execution"
            , dependsOnMethods = "testRequestSimulationDataSent")
    public void testRequestStatGeneratorSparkScriptExecution() throws Exception {
        //run the script
        executeSparkScript(SPARK_SCRIPT);
        int i = 0;
        boolean scriptExecuted = false;
        while (i < MAX_TRIES) {
            Thread.sleep(10000);
            long percentileTableCount = getRecordCount(-1234, REQUEST_PERCENTILE_TABLE);
            scriptExecuted = (percentileTableCount == 2);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted, "Spark script did not execute as expected!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal ResponseTime Alert",
            dependsOnMethods = "testRequestStatGeneratorSparkScriptExecution")
    public void testAbnormalRequestCountAlert() throws Exception {
        int initialCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"external","s8SWbnmzQEgzMIsol7AHt9cjhEsa","/calc/1.0","CalculatorAPI:v1.0","CalculatorAPI",
                        "/add?x=12&y=3","/add","GET","1.0","1","1456894602313","admin@carbon.super","carbon.super","192.168.66.1",
                        "admin@carbon.super","DefaultApplication","1","Mozilla/5.0","Unlimited","False","127.0.01",
                        "admin"}
        );

        for (int i=0;i<15;i++){
            publishEvent(eventDto);
        }

        boolean abnormalRequestCountAlertTriggered = isAlertReceived(initialCount, "Unique ID: logger_abnormalRequestCount", 5 ,5000);
        Assert.assertTrue(abnormalRequestCountAlertTriggered, "Abnormal Response Count Alert event not received!");
    }


}
