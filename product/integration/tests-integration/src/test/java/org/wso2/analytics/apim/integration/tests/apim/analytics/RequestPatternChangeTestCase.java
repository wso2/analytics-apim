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

public class RequestPatternChangeTestCase extends APIMAnalyticsBaseTestCase {

    private static final Log log = LogFactory.getLog(RequestPatternChangeTestCase.class);

    private final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String STREAM_VERSION = "1.1.0";
    private final String REQUEST_TABLE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST";
    private final String TEST_RESOURCE_PATH = "requestPatternChange";
    private final String PUBLISHER_FILE = "logger_requestPatternChange.xml";
    private final String METRIC_EXECUTION_PLAN_NAME = "APIMAnalytics-RequestPatternChangeDetection-APIRequestPatternChangeAnalysisMetric-realtime1";
    private final String MATRIXBUILDER_EXECUTION_PLAN_NAME = "APIMAnalytics-APIRequestPatternChangeAnalysisMatrixBuilder";
    private final String MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME = "APIMAnalytics-MarkovStateClassifier-MarkovStateClassifier-realtime1";
    private final int MAX_TRIES = 25;
    private String originalExecutionPlanMatrixBuilder;
    private String originalExecutionMetric;
    private String originalExecutionMarkovStateClassifier;



    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.MARKOV_MODEL_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.MARKOV_MODEL_TABLE);
        }
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        Thread.sleep(5000);
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        // publish the csv data
        editActiveExecutionPlan(getActiveExecutionPlan(METRIC_EXECUTION_PLAN_NAME),METRIC_EXECUTION_PLAN_NAME);
        editActiveExecutionPlan(getActiveExecutionPlan(MATRIXBUILDER_EXECUTION_PLAN_NAME),MATRIXBUILDER_EXECUTION_PLAN_NAME);
        editActiveExecutionPlan(getActiveExecutionPlan(MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME),MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME);

        originalExecutionPlanMatrixBuilder = eventProcessorAdminServiceClient.getActiveExecutionPlan(MATRIXBUILDER_EXECUTION_PLAN_NAME);
        originalExecutionMetric = eventProcessorAdminServiceClient.getActiveExecutionPlan(METRIC_EXECUTION_PLAN_NAME);
        originalExecutionMarkovStateClassifier = eventProcessorAdminServiceClient.getActiveExecutionPlan(MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME);


        redeployExecutionPlan();
        // publish the csv data
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "sim.csv", getStreamId(STREAM_NAME, STREAM_VERSION), 200);
    }

    public void redeployExecutionPlan() throws Exception {
        int count = getActiveExecutionPlanCount();
        deleteExecutionPlan(METRIC_EXECUTION_PLAN_NAME);
        deleteExecutionPlan(MATRIXBUILDER_EXECUTION_PLAN_NAME);
        deleteExecutionPlan(MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME);
        Thread.sleep(1000);
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, METRIC_EXECUTION_PLAN_NAME + ".siddhiql"));
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH,MATRIXBUILDER_EXECUTION_PLAN_NAME  + ".siddhiql"));
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME + ".siddhiql"));
        do { // wait till it get redeployed
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != count);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        // undeploy the publishers
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.FIRST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_COUNT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_COUNT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.MARKOV_MODEL_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.MARKOV_MODEL_TABLE);
        }
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        undeployPublisher(PUBLISHER_FILE);

        deleteExecutionPlan(METRIC_EXECUTION_PLAN_NAME);
        deleteExecutionPlan(MATRIXBUILDER_EXECUTION_PLAN_NAME);
        deleteExecutionPlan(MARKOVSTATECLASSIFIER_EXECUTION_PLAN_NAME);

        addExecutionPlan(originalExecutionPlanMatrixBuilder);
        addExecutionPlan(originalExecutionMetric);
        addExecutionPlan(originalExecutionMarkovStateClassifier);

    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published")
    public void testSimulationDataSent() throws Exception {
        int i = 0;
        long requestEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            requestEventCount = getRecordCount(-1234, REQUEST_TABLE);
            eventsPublished = (requestEventCount >= 18);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published, expected entry count:18 but found: " +
                +requestEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Request Pattern Change Alert", dependsOnMethods = "testSimulationDataSent")
    public void testRequestPatternChangeAlert() throws Exception {
        if (isTableExist(-1234, "ORG_WSO2_ANALYTICS_APIM_REQUESTPATTERNALERTSUMMARYTABLE")) {
            deleteData(-1234, "ORG_WSO2_ANALYTICS_APIM_REQUESTPATTERNALERTSUMMARYTABLE");
        }
        Thread.sleep(1000);
        
        logViewerClient.clearLogs();

        EventDto eventDto1 = new EventDto();
        eventDto1.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto1.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785133999",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.29","admin" });
        publishEvent(eventDto1);

        EventDto eventDto2 = new EventDto();
        eventDto2.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto2.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/get_fraud", "/get_fraud", "GET", "1", "1", "1455785134866",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.29","admin" });
        publishEvent(eventDto2);

        EventDto eventDto3 = new EventDto();
        eventDto3.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto3.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/pay", "/pay", "GET", "1", "1", "1455785135866",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.29","admin" });
        publishEvent(eventDto3);
        
        EventDto eventDto4 = new EventDto();
        eventDto4.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto4.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/fraud", "/fraud", "GET", "1", "1", "1455785135866",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.29","admin" });
        publishEvent(eventDto4);

        boolean requestPatternChangeAlert = isAlertReceived(0, "Unique ID: logger_requestPatternChange", 84 ,2000);

        Assert.assertTrue(requestPatternChangeAlert, "Request pattern change alert event not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Request Pattern Change Alert is not generated for normal pattern",
            dependsOnMethods = "testSimulationDataSent")
    public void testNoRequestPatternChangeAlert() throws Exception {

        logViewerClient.clearLogs();

        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[] { "external", "D4rf6fvCohQ7kbQ970euK0LmjcQa", "/calc/1.0", "CalculatorAPI:v1.0",
                        "CalculatorAPI", "/search", "/search", "GET", "1", "1", "1455785136866",
                        "fazlan@carbon.super", "carbon.super", "10.100.7.100", "fazlan@carbon.super",
                        "DefaultApplication", "1", "chrome", "Unlimited", "False", "192.168.1.27","admin" });
        publishEvent(eventDto);

        boolean requestPatternChangeAlert = isAlertReceived(0, "Unique ID: logger_requestPatternChange", 5 ,2000);

        Assert.assertFalse(requestPatternChangeAlert, "Request pattern change alert event not received!");
    }

}
