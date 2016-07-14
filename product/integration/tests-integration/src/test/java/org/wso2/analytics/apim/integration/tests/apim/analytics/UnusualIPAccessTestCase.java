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

import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

public class UnusualIPAccessTestCase extends APIMAnalyticsBaseTestCase {
    private final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "unusualIPAccess";
    private final String PUBLISHER_FILE = "logger.xml";
    private final String ALERT_TABLE_NAME = "ORG_WSO2_ANALYTICS_APIM_IPACCESSSUMMARY";
    private final String REQUEST_TABLE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-UnusualIPAccessTemplate-UnusualIPAccessAlert-realtime1";
    private final int MAX_TRIES = 5;
    private String originalExecutionPlan;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME),EXECUTION_PLAN_NAME);
        originalExecutionPlan = eventProcessorAdminServiceClient.getActiveExecutionPlan(EXECUTION_PLAN_NAME);
        redeployExecutionPlan();
    }

    public void redeployExecutionPlan() throws Exception {
        int count = getActiveExecutionPlanCount();
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        Thread.sleep(1000);
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, EXECUTION_PLAN_NAME + ".siddhiql"));
        do { // wait till it get redeployed
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != count);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        // undeploy the publishers
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        undeployPublisher(PUBLISHER_FILE);
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        addExecutionPlan(originalExecutionPlan);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published")
    public void testSimulationDataSent() throws Exception {
        // publish the csv data
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 20);
        
        int i = 0;
        long requestEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            requestEventCount = getRecordCount(-1234, REQUEST_TABLE);
            eventsPublished = (requestEventCount >= 3);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published, expected entry count:3 but found: " +requestEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if it waits for the provided request count to" +
            " proceed with alerting", dependsOnMethods = "testSimulationDataSent")
    public void testAlertSuppressionCount() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785134010", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192" +
                ".168.7.1","admin"});
//        publishEvent(eventDto);

        EventDto eventDto2 = new EventDto();
        eventDto2.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto2.setAttributeValues(new String[]{"external", "sdgdsM3_Dfhy4_o6KLsxa", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785134100", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192" +
                ".168.7.1","admin"});
        publishEvent(eventDto2);

        Thread.sleep(1000);
        boolean newIpDetectedAlertFound = isAlertReceived(0, "\"type\":\"UnusualIPAccessAlert\"," +
                "\"msg\":\"A request from a new IP", 10 ,1000);
        Assert.assertFalse(newIpDetectedAlertFound, "Request count alert suppression does not work");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test New IP detected Alert", dependsOnMethods = "testAlertSuppressionCount")
    public void testNewIPDetectedAlert() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785134110", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1", "admin"});

        for (int i = 0; i < 10; i++) {
            publishEvent(eventDto);
        }

        boolean newIpDetectedAlertFound = isAlertReceived(0, "\"type\":\"UnusualIPAccessAlert\",\"msg\":\"A request from a new IP", 50 ,5000);
        Assert.assertTrue(newIpDetectedAlertFound, "New IP Detected event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Old IP detected Alert", dependsOnMethods = "testNewIPDetectedAlert")
    public void testOldIPDetectedAlert() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455787826110", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1","admin"});
        publishEvent(eventDto);

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues(new String[]{"external", "sdgdsM3_Dfhy4_o6KLsxa", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455787826111", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1","admin"});
        publishEvent(eventDto1);

        boolean oldIpDetectedAlert = isAlertReceived(0, "msg\":\"A request from an old IP", 50 ,5000);
        Assert.assertTrue(oldIpDetectedAlert, "Old IP Detected event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test No new IP detected for first event", dependsOnMethods = "testOldIPDetectedAlert")
    public void testFirstEventAlert() throws Exception {
        deleteData(-1234, ALERT_TABLE_NAME.replace('.', '_'));
        Thread.sleep(2000);
        logViewerClient.clearLogs();
        
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455787826120", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.4", "admin"});
        publishEvent(eventDto);

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues(new String[]{"external", "sdgdsM3_Dfhy4_o6KLsxa", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455787826130", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.4", "admin"});
        publishEvent(eventDto1);

        boolean newIPDetectedAlertFound = isAlertReceived(0, ":\"UnusualIPAccessAlert\",\"msg\":" +
                "\"A request from a new IP", 5 ,5000);
        Assert.assertFalse(newIPDetectedAlertFound, "New IP Detected alert received for first event!");
    }
}