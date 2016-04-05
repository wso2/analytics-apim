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
    private final String SPARK_SCRIPT = "APIMAnalytics-ConfigureAccessToken";
    private final String SUMMARY_TABLE = "AccessTokenRefreshSummaryTable";
    private final int MAX_TRIES = 5;
    private long initialTimestamp;
    private String BASE_EVENT_STRING = "apim,carbon.super,home,s8SWbnmzQEgzMIsol7AHt9cjhEsa,refreshToken,id1232,ab,c,true,200," +
            "success,86400,604800,";

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        initialTimestamp = System.currentTimeMillis() - 6000;
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), "Abnormal Token Refresh Alert spark script is not deployed!");
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
            eventsPublished = (oAuthEventCount == 6);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
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
            scriptExecuted = (summaryTableCount == 1);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted, "Spark script did not execute as expected!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal Access Token Refresh Alert",
            dependsOnMethods = "testScriptExecution")
    public void testAbnormalTokenRefreshAlert() throws Exception {
        int initialCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 550)).split(","));
        publishEvent(eventDto);

        boolean abnormalTokenRefreshFound = isAlertReceived(initialCount, "msg:Abnormal Access Token Refresh Detected " +
                "from User:carbon.super-home-apim for Consumer Key: s8SWbnmzQEgzMIsol7AHt9cjhEsa", 5 ,2000);
        Assert.assertTrue(abnormalTokenRefreshFound, "Abnormal Token Refresh Alert event not received!");
    }

    private List<EventDto> publishSimulationData() throws RemoteException {
        List<EventDto> eventsList = new ArrayList<>();

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 90)).split(","));

        EventDto eventDto2 = new EventDto();
        eventDto2.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto2.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 190)).split(","));

        EventDto eventDto3 = new EventDto();
        eventDto3.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto3.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 295)).split(","));

        EventDto eventDto4 = new EventDto();
        eventDto4.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto4.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 385)).split(","));

        EventDto eventDto5 = new EventDto();
        eventDto5.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto5.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 400)).split(","));

        EventDto eventDto6 = new EventDto();
        eventDto6.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto6.setAttributeValues((BASE_EVENT_STRING + (initialTimestamp + 502)).split(","));

        eventsList.add(eventDto1);
        eventsList.add(eventDto2);
        eventsList.add(eventDto3);
        eventsList.add(eventDto4);
        eventsList.add(eventDto5);
        eventsList.add(eventDto6);

        return eventsList;
    }
}
