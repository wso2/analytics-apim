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
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.common.utils.CSVSimulatorUtil;
import org.wso2.carbon.event.simulator.stub.types.EventDto;
import org.wso2.carbon.logging.view.stub.types.carbon.LogEvent;

import java.util.List;

public class UnusualIPAccessTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(UnusualIPAccessTestCase.class);

    private String streamName = "org.wso2.apimgt.statistics.request";
    private String streamVersion = "1.1.0";

    @Test(groups = "wso2.analytics.apim", description = "Test New IP detected Alert")
    public void testNewIPDetectedAlert() throws Exception {
        String testResourcePath = "unusualIPAccess";

        // publish the publisher xml file
        int startEPCount = eventPublisherAdminServiceClient.getActiveEventPublisherCount();
        String eventPublisherConfig = getXMLArtifactConfiguration(testResourcePath, "logger.xml");
        eventPublisherAdminServiceClient.addEventPublisherConfiguration(eventPublisherConfig);
        Assert.assertEquals(eventPublisherAdminServiceClient.getActiveEventPublisherCount(), startEPCount + 1);

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        List<EventDto> eventListFromCSV = CSVSimulatorUtil.getEventListFromCSV(getFilePath(testResourcePath, "sim.csv"), getStreamId(streamName, streamVersion));
        pubishEvents(eventListFromCSV, 100);
       /* Object[] payload1 = new Object[]{"app1", "test", "1.1.0", "calculator", "/add", "1.2", "GET", "1.1.0", 4,
                1457943159411L, "sachith", "carbon.super", "localhost", "pub", "calculator", "calc1.2", "firefox",
                "1", false, "10.10.2.2"};
        Event event1 = new Event(null, System.currentTimeMillis(), new Object[]{"test"}, new Object[0], payload1);

        Object[] payload2 = new Object[]{"app1", "test", "1.1.0", "calculator", "/add", "1.2", "GET", "1.1.0", 4,
                1457943159411L, "sachith", "carbon.super", "localhost", "pub", "calculator", "calc1.2", "firefox",
                "1", false, "10.10.2.3"};
        Event event2 = new Event(null, System.currentTimeMillis(), new Object[]{"test"}, new Object[0], payload2);

        publishEvent(streamName, streamVersion, event1);
       // publishEvent(streamName, streamVersion, event2);*/

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(streamName, streamVersion));
        eventDto.setAttributeValues(new String[]{"external", "tC3RKfeSoUetfMy4_o6KLAk7fX4a", "/calc/1.0", "CalculatorAPI:v1.0"
                , "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785133344", "sachith@carbon.super", "carbon.super",
                "10.100.7.100", "apim@carbon.super", "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.7.1"});
        eventSimulatorAdminServiceClient.sendEvent(eventDto);
        Thread.sleep(5000);

        boolean newIpDetectedAlertFound = false;
        LogEvent[] logs = logViewerClient.getAllRemoteSystemLogs();
        for (int i = 0; i < (logs.length - beforeCount); i++) {
            if (logs[i].getMessage().contains("\"payloadData\":{\"type\":\"[UnusualIPAccessAlert]\"," +
                    "\"msg\":\"A request from a new IP detected! IP: 192.168.7.1\",\"ip\":\"192.168.7.1\"," +
                    "\"consumerKey\":\"tC3RKfeSoUetfMy4_o6KLAk7fX4a\",\"userId\":\"sachith@carbon.super\"," +
                    "\"requestTime\":1455785133344,")) {
                newIpDetectedAlertFound = true;
                break;
            }
        }
        Assert.assertTrue(newIpDetectedAlertFound, "New IP Detected event not received!");

        eventPublisherAdminServiceClient.removeInactiveEventPublisherConfiguration("logger.xml");
    }
}