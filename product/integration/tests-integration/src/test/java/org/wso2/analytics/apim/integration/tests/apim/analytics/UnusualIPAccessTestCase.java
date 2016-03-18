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

    private String streamName = "org.wso2.apimgt.statistics.request";
    private String streamVersion = "1.1.0";
    private String testResourcePath = "unusualIPAccess";
    private String publisherFileName = "logger.xml";

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();

        // deploy the publisher xml file
        deployPublisher(testResourcePath, publisherFileName);
        // publish the csv data
        pubishEventsFromCSV(testResourcePath, "sim.csv", getStreamId(streamName, streamVersion), 100);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
        undeployPublisher(publisherFileName);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test New IP detected Alert")
    public void testNewIPDetectedAlert() throws Exception {

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(streamName, streamVersion));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1"});
        eventSimulatorAdminServiceClient.sendEvent(eventDto);
        Thread.sleep(5000);

        boolean newIpDetectedAlertFound = isAlertReceived(beforeCount, "\"type\":\"UnusualIPAccessAlert\"," +
                "\"msg\":\"A request from a new IP detected! IP: 192.168.7.1\",\"ip\":\"192.168.7.1\"," +
                "\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\",\"userId\":\"sachith@carbon.super\"," +
                "\"requestTime\":1455785133344,");
        Assert.assertTrue(newIpDetectedAlertFound, "New IP Detected event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Old IP detected Alert", dependsOnMethods = "testNewIPDetectedAlert")
    public void testOldIPDetectedAlert() throws Exception {
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(streamName, streamVersion));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1465785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1"});
        eventSimulatorAdminServiceClient.sendEvent(eventDto);
        Thread.sleep(5000);

        boolean oldIpDetectedAlert = isAlertReceived(beforeCount, "\"msg\":\"A request from an Old IP detected! IP: 192.168.7.1\"," +
                "\"ip\":\"192.168.7.1\",\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\"," +
                "\"userId\":\"sachith@carbon.super\",\"requestTime\":1465785133344,\"");
        Assert.assertTrue(oldIpDetectedAlert, "Old IP Detected event not received!");
    }
}