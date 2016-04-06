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

public class UnusualIPAccessTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(UnusualIPAccessTestCase.class);

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "unusualIPAccess";
    private final String PUBLISHER_FILE = "logger.xml";
    private final String ALERT_TABLE_NAME = "IPACCESSSUMMARY";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-UnusualIPAccessAlert";
    private final int MAX_TRIES = 5;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        // publish the csv data
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 200);
        editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME),EXECUTION_PLAN_NAME);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published")
    public void testSimulationDataSent() throws Exception {
        int i = 0;
        long requestEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            requestEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));
            eventsPublished = (requestEventCount == 500);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if it waits for the provided request count to" +
            " proceed with alerting", dependsOnMethods = "testSimulationDataSent")
    public void testAlertSuppressionCount() throws Exception {

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192" +
                ".168.7.1","admin"});
        publishEvent(eventDto);

        boolean newIpDetectedAlertFound = isAlertReceived(beforeCount, "\"type\":\"UnusualIPAccessAlert\"," +
                "\"msg\":\"A request from a new IP detected! IP: 192.168.7.1\",\"ip\":\"192.168.7.1\"," +
                "\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\",\"userId\":\"sachith@carbon.super\"," +
                "\"requestTime\":1455785133344,", 5 ,5000);
        Assert.assertFalse(newIpDetectedAlertFound, "Request count alert suppression does not work");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test New IP detected Alert", dependsOnMethods = "testAlertSuppressionCount")
    public void testNewIPDetectedAlert() throws Exception {

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1"});
        publishEvent(eventDto);

        boolean newIpDetectedAlertFound = isAlertReceived(beforeCount, "\"type\":\"UnusualIPAccessAlert\"," +
                "\"msg\":\"A request from a new IP detected! IP: 192.168.7.1\",\"ip\":\"192.168.7.1\"," +
                "\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\",\"userId\":\"sachith@carbon.super\"," +
                "\"requestTime\":1455785133344,", 50 ,5000);
        Assert.assertTrue(newIpDetectedAlertFound, "New IP Detected event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Old IP detected Alert", dependsOnMethods = "testNewIPDetectedAlert")
    public void testOldIPDetectedAlert() throws Exception {
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1465785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1"});
        publishEvent(eventDto);

        boolean oldIpDetectedAlert = isAlertReceived(beforeCount, "\"msg\":\"A request from an Old IP detected! IP: 192.168.7.1\"," +
                "\"ip\":\"192.168.7.1\",\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\"," +
                "\"userId\":\"sachith@carbon.super\",\"requestTime\":1465785133344,\"", 50 ,5000);
        Assert.assertTrue(oldIpDetectedAlert, "Old IP Detected event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test No new IP detected for first event", dependsOnMethods = "testOldIPDetectedAlert")
    public void testFirstEventAlert() throws Exception {
        deleteData(-1234, ALERT_TABLE_NAME.replace('.', '_'));
        Thread.sleep(5000);
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1465785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.4"});
        publishEvent(eventDto);

        boolean newIPDetectedAlertFound = isAlertReceived(beforeCount, ":\"UnusualIPAccessAlert\",\"msg\":" +
                "\"A request from a new IP detected! IP: 192.168.7.4\",\"ip\":\"192.168.7.4\",\"consumerKey\":" +
                "\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\",\"userId\":\"sachith@carbon.super\",\"requestTime\":1465785133344,\"", 5 ,5000);
        Assert.assertFalse(newIPDetectedAlertFound, "New IP Detected alert received for first event!");
    }
}