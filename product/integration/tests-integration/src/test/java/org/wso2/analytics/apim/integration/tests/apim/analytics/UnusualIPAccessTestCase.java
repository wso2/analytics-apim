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
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.logging.view.stub.types.carbon.LogEvent;

public class UnusualIPAccessTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(UnusualIPAccessTestCase.class);

    private String streamName = "org.wso2.apimgt.statistics.request";
    private String streamVersion = "1.1.0";

    @Test(groups = "wso2.analytics.apim", description = "Test New IP detected Alert")
    public void testNewIPDetectedAlert() throws Exception {
        String testResourcePath = "unusualIPAccess";

        //delete the existing data in the streams/tables
        analyticsDataAPI.deleteTable(-1234, streamName.replace('.', '_'));

        // publish the publisher xml file
        int startEPCount = eventPublisherAdminServiceClient.getActiveEventPublisherCount();
        String eventPublisherConfig = getXMLArtifactConfiguration(testResourcePath, "logger.xml");
        eventPublisherAdminServiceClient.addEventPublisherConfiguration(eventPublisherConfig);
        Assert.assertEquals(eventPublisherAdminServiceClient.getActiveEventPublisherCount(), startEPCount + 1);

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        Object[] payload1 = new Object[]{"app1", "test", "1.1.0", "calculator", "/add", "1.2", "GET", "1.1.0", 4,
                1457943159411L, "sachith", "carbon.super", "localhost", "pub", "calculator", "calc1.2", "firefox",
                "1", false, "10.10.2.2"};
        Event event1 = new Event(null, System.currentTimeMillis(), new Object[]{"test"}, new Object[0], payload1);

        Object[] payload2 = new Object[]{"app1", "test", "1.1.0", "calculator", "/add", "1.2", "GET", "1.1.0", 4,
                1457943159411L, "sachith", "carbon.super", "localhost", "pub", "calculator", "calc1.2", "firefox",
                "1", false, "10.10.2.3"};
        Event event2 = new Event(null, System.currentTimeMillis(), new Object[]{"test"}, new Object[0], payload2);

        publishEvent(streamName, streamVersion, event1);
        publishEvent(streamName, streamVersion, event2);

        boolean newIpDetectedAlertFound = false;
        LogEvent[] logs = logViewerClient.getAllRemoteSystemLogs();
        for (int i = 0; i < (logs.length - beforeCount); i++) {
            if (logs[i].getMessage().contains("payloadData\":{\"type\":\"[UnusualIPAccessAlert]\"," +
                    "\"msg\":\"A request from a new IP detected! IP: 10.10.2.3\",\"ip\":\"10.10.2.3\"," +
                    "\"consumerKey\":\"app1\",\"userId\":\"sachith\",\"requestTime\":1457943159411")) {
                newIpDetectedAlertFound = true;
                break;
            }
        }
        Assert.assertTrue(newIpDetectedAlertFound, "New IP Detected event not received!");

        eventPublisherAdminServiceClient.removeInactiveEventPublisherConfiguration("logger.xml");
    }
}