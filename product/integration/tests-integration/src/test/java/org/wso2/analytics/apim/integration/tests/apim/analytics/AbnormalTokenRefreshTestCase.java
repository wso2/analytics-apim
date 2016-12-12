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

import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.List;

public class AbnormalTokenRefreshTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(AbnormalTokenRefreshTestCase.class);

    private final String STREAM_NAME = "org.wso2.carbon.identity.oauth.token.issuance";
    private final String STREAM_VERSION = "1.0.0";
    private final String TEST_RESOURCE_PATH = "abnormalTokenRefresh";
    private final String PUBLISHER_FILE = "logger_abnormalAccessTokenRefresh.xml";
    private final String SPARK_SCRIPT = "APIMAnalytics-ConfigureAccessToken-ConfigureAccessToken-batch1";
    private final String SUMMARY_TABLE = "ORG_WSO2_ANALYTICS_APIM_ACCESSTOKENREFRESHSUMMARYTABLE";
    private final String REFRESH_TIME_DIFFERENCE_TABLE = "ORG_WSO2_ANALYTICS_APIM_ACCESSTOKENREFRESHTIMEDIFFERENCE";
    private final String LAST_ACCESS_TOKEN_REFRESH_TABLE = "ORG_WSO2_ANALYTICS_APIM_LASTACCESSTOKENREFRESHEVENTTABLE";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-AbnormalAccessTokenRefresh";
    private final int MAX_TRIES = 5;
    private long initialTimestamp;
    private String BASE_EVENT_ONE_STRING = "apim,carbon.super,home,s8SWbnmzQEgzMIsol7AHt9cjhEsa,refreshToken,id1232,ab,c,true,200," +
            "success,86400,604800,";
    private String BASE_EVENT_TWO_STRING = "apim,carbon.super,home,h8jfbnghUKepMIulu43Ht9cjaRfh,refreshToken,id1242,ab,c,true,200," +
            "success,86400,604800,";

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        initialTimestamp = System.currentTimeMillis() - 6000;
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, SUMMARY_TABLE)) {
            deleteData(-1234, SUMMARY_TABLE);

        }
        if (isTableExist(-1234, REFRESH_TIME_DIFFERENCE_TABLE)) {
            deleteData(-1234, REFRESH_TIME_DIFFERENCE_TABLE);

        }
        if (isTableExist(-1234, LAST_ACCESS_TOKEN_REFRESH_TABLE)) {
            deleteData(-1234, LAST_ACCESS_TOKEN_REFRESH_TABLE);

        }
        editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME),EXECUTION_PLAN_NAME);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(-1234, SUMMARY_TABLE)) {
            deleteData(-1234, SUMMARY_TABLE);

        }
        if (isTableExist(-1234, REFRESH_TIME_DIFFERENCE_TABLE)) {
            deleteData(-1234, REFRESH_TIME_DIFFERENCE_TABLE);

        }
        if (isTableExist(-1234, LAST_ACCESS_TOKEN_REFRESH_TABLE)) {
            deleteData(-1234, LAST_ACCESS_TOKEN_REFRESH_TABLE);
        }
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), "Abnormal Token Refresh Alert spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test whether the Spark Script is scheduled",
            dependsOnMethods = "testSparkScriptDeployment")
    public void testSparkScriptScheduled() throws Exception {
        Assert.assertTrue(isSparkScriptScheduled(SPARK_SCRIPT), SPARK_SCRIPT + " spark script is not scheduled!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testSparkScriptDeployment")
    public void testSimulationDataSent() throws Exception {
        //publish training data
        List<EventDto> eventDtoList = publishSimulationData();
        pubishEvents(eventDtoList, 100);

        int i = 0;
        long oAuthEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            oAuthEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));
            eventsPublished = (oAuthEventCount >= 6);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published , expected entry count:6 but found: " +oAuthEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal Access Token Refresh Alert Spark Script execution"
            , dependsOnMethods = "testSimulationDataSent")
    public void testScriptExecution() throws Exception {
        //run the script
        executeSparkScript(SPARK_SCRIPT);
        int i = 0;
        long summaryTableCount = 0;
        boolean scriptExecuted = false;
        while (i < MAX_TRIES) {
            Thread.sleep(10000);
            summaryTableCount = getRecordCount(-1234, SUMMARY_TABLE);
            scriptExecuted = (summaryTableCount >= 1);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted, "Spark script did not execute as expected, expected entry count:1 but found: "+summaryTableCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal Access Token Refresh Alert is not generated for normal scenarios",
            dependsOnMethods = "testScriptExecution")
    public void testNormalTokenRefreshAlert() throws Exception {
        logViewerClient.clearLogs();

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 652)).split(","));
        publishEvent(eventDto1);

        boolean abnormalTokenRefreshFound = isAlertReceived(0, "msg:Abnormal Access Token Refresh Detected " +
                "from User:carbon.super-home-apim", 5 ,2000);
        Assert.assertFalse(abnormalTokenRefreshFound, "Abnormal Token Refresh Alert is received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal Access Token Refresh Alert",
            dependsOnMethods = "testNormalTokenRefreshAlert")
    public void testAbnormalTokenRefreshAlert() throws Exception {
        logViewerClient.clearLogs();

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 55550)).split(","));
        publishEvent(eventDto1);

        EventDto eventDto2 = new EventDto();
        eventDto2.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto2.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 65550)).split(","));
        publishEvent(eventDto2);

        boolean abnormalTokenRefreshFound = isAlertReceived(0, "msg:Abnormal access token refresh detected", 50 ,5000);
        Assert.assertTrue(abnormalTokenRefreshFound, "Abnormal Token Refresh Alert event not received!");
    }

    private List<EventDto> publishSimulationData() throws RemoteException {
        List<EventDto> eventsList = new ArrayList<>();

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 90)).split(","));

        EventDto eventDto2 = new EventDto();
        eventDto2.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto2.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 190)).split(","));

        EventDto eventDto3 = new EventDto();
        eventDto3.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto3.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 295)).split(","));

        EventDto eventDto4 = new EventDto();
        eventDto4.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto4.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 385)).split(","));

        EventDto eventDto5 = new EventDto();
        eventDto5.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto5.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 400)).split(","));

        EventDto eventDto6 = new EventDto();
        eventDto6.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto6.setAttributeValues((BASE_EVENT_ONE_STRING + (initialTimestamp + 502)).split(","));

        EventDto eventDto7 = new EventDto();
        eventDto7.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto7.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 90)).split(","));

        EventDto eventDto8 = new EventDto();
        eventDto8.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto8.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 190)).split(","));

        EventDto eventDto9 = new EventDto();
        eventDto9.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto9.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 295)).split(","));

        EventDto eventDto10 = new EventDto();
        eventDto10.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto10.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 385)).split(","));

        EventDto eventDto11 = new EventDto();
        eventDto11.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto11.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 400)).split(","));

        EventDto eventDto12 = new EventDto();
        eventDto12.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto12.setAttributeValues((BASE_EVENT_TWO_STRING + (initialTimestamp + 502)).split(","));

        eventsList.add(eventDto1);
        eventsList.add(eventDto2);
        eventsList.add(eventDto3);
        eventsList.add(eventDto4);
        eventsList.add(eventDto5);
        eventsList.add(eventDto6);
        eventsList.add(eventDto7);
        eventsList.add(eventDto8);
        eventsList.add(eventDto9);
        eventsList.add(eventDto10);
        eventsList.add(eventDto11);
        eventsList.add(eventDto12);

        return eventsList;
    }
}
