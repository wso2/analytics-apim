/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.wso2.analytics.apim.integration.tests.apim.analytics;

import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

import java.rmi.RemoteException;

public class FrequentTierHittingTestCase extends APIMAnalyticsBaseTestCase {

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.throttle";
    private final String STREAM_VERSION = "1.0.0";
    private final String TEST_RESOURCE_PATH = "tierLimitHitting";
    private final String PUBLISHER_FILE = "logger_frequentTierHitting.xml";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-FrequentTierLimitHitting-FrequentTierLimitHitting-realtime1";

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();

        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME), EXECUTION_PLAN_NAME);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test frequent tier limit hitting")
    public void testFrequentTierHittingAlert() throws Exception {

        logViewerClient.clearLogs();
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "test_throttling.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 10);

        Thread.sleep(1000);

        boolean noUserAlert = isAlertReceived(
                0,
                "applicationId:2,\napplicationName:application2,\ntenantDomain:carbon.super,\nmsg:User user1 frequently crosses the limit set.",
                5, 1000);
        Assert.assertFalse(noUserAlert, "Tier hitting messages received for user1");

        boolean alertSubscriber = isAlertReceived(
                0,
                "subscriber:subscriber1@carbon.super,\napiPublisher:publisher1@carbon.super,\napi:deeplearning,\napplicationId:1,\napplicationName:application1,\ntenantDomain:carbon.super,\nmsg:Application frequently goes beyond the allocated quota",
                5, 1000);

        Assert.assertTrue(alertSubscriber, "Tier hitting messages has not received for application1");

        boolean alertUser = isAlertReceived(
                0,
                "subscriber:subscriber1@carbon.super,\napiPublisher:publisher1@carbon.super,\napi:svm,\napplicationId:1,\napplicationName:application1,\ntenantDomain:carbon.super,\nmsg:User user1 frequently crosses the limit set.",
                5, 1000);
        Assert.assertTrue(alertUser, "Tier hitting messages has not user1");

        Thread.sleep(1000);

        // add few more events and check whether script fires an alert
        publishEventForPublisher2();

        boolean alertSubscriber2 = isAlertReceived(
                0,
                "subscriber:subscriber2,\napiPublisher:publisher2,\napi:deeplearning,\napplicationId:1,\napplicationName:application1,\ntenantDomain:carbon.abc,\nmsg:Application frequently goes beyond the allocated quota",
                5, 1000);
        Assert.assertTrue(alertSubscriber2, "Tier hitting messages has not application2");

    }

    private void publishEventForPublisher2() throws Exception {

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133403",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133404",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133405",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133406",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133407",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133408",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

        eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(new String[] { "external", "sqbkktg3s00vzz7gg3s19", "user1", "carbon.abc",
                "deeplearning", "Deeplearning:1", "deeplearning/predict", "publisher2", "1455785133409",
                "application1", "1", "subscriber2", "SUBSCRIPTION_LIMIT_EXCEEDED" });
        publishEvent(eventDto);
        Thread.sleep(1000);

    }

}
