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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

import java.rmi.RemoteException;

public class RequestPatternChangeTestCase extends APIMAnalyticsBaseTestCase {

    private static final Log log = LogFactory.getLog(RequestPatternChangeTestCase.class);

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "requestPatternChange";
    private final String PUBLISHER_FILE = "logger_requestPatternChange.xml";
    private final String METRIC_EXECUTION_PLAN_NAME = "APIMAnalytics-APIRequestPatternChangeAnalysisMetric";
    private final String METRICBUILDER_EXECUTION_PLAN_NAME = "APIMAnalytics-APIRequestPatternChangeAnalysisMatrixBuilder";
    private final int MAX_TRIES = 25;


    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.MARKOV_MODEL_TABLE);
        }
        if (isTableExist(-1234, STREAM_NAME.replace('.', '_'))) {
            deleteData(-1234, STREAM_NAME.replace('.', '_'));
        }
        Thread.sleep(5000);
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        // publish the csv data
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 200);
        editActiveExecutionPlan(getActiveExecutionPlan(METRIC_EXECUTION_PLAN_NAME),METRIC_EXECUTION_PLAN_NAME);
        editActiveExecutionPlan(getActiveExecutionPlan(METRICBUILDER_EXECUTION_PLAN_NAME),METRICBUILDER_EXECUTION_PLAN_NAME);
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
            Thread.sleep(5000);
            requestEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));
            eventsPublished = (requestEventCount == 500);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Request Pattern Change Alert", dependsOnMethods = "testSimulationDataSent")
    public void testRequestPatternChangeAlert() throws Exception {

        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/pay_fraud", "/pay_fraud", "GET", "1", "1", "1455785133372",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.29","admin" });
        publishEvent(eventDto);

        boolean requestPatternChangeAlert = isAlertReceived(beforeCount, "Unique ID: logger_requestPatternChange", 84 ,5000);

        Assert.assertTrue(requestPatternChangeAlert, "Request pattern change alert event not received!");
    }

}
