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
package org.wso2.analytics.apim.integration.tests.apim.incrementalprocessing;

import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.tests.apim.analytics.APIMAnalyticsBaseTestCase;

public class IncrementalProcessingTestCase extends APIMAnalyticsBaseTestCase {

    private static final String REQUESTS_PER_MINUTE_STREAM_NAME = "org.wso2.apimgt.statistics.perMinuteRequest";
    private static final String RESPONSES_PER_MINUTE_STREAM_NAME = "org.wso2.apimgt.statistics.perMinuteResponse";
    private static final String EXECUTION_TIMES_PER_MINUTE_STREAM_NAME = "org.wso2.apimgt.statistics.perMinuteExecutionTimes";

    private static final String REQUESTS_PER_MINUTE_STREAM_VERSION = "1.0.0";
    private static final String RESPONSES_PER_MINUTE_STREAM_VERSION = "1.0.0";
    private static final String EXECUTION_TIMES_PER_MINUTE_STREAM_VERSION = "1.0.0";

    private static final String TEST_RESOURCE_PATH = "incrementalProcessing";
    private static final String TEST_REQUESTS_FILE = "requests.csv";
    private static final String TEST_RESPONSES_FILE = "responses.csv";
    private static final String TEST_EXECUTION_TIMES_FILE = "executionTimes.csv";

    private static final String SPARK_SCRIPT = "APIM_INCREMENTAL_PROCESSING_SCRIPT";

    private static final String ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST = "ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST = "ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE = "ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE = "ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERMINUTEEXECUTIONTIMES = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEEXECUTIONTIMES";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES = "ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES";
    private static final String ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES = "ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES";

    private final int MAX_TRIES = 20;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        purgeData();
        Thread.sleep(1000);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        purgeData();
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testIncrementalProcessingSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), SPARK_SCRIPT + " spark script is not deployed.");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published",
            dependsOnMethods = "testIncrementalProcessingSparkScriptDeployment")
    public void testInitialSimulationDataSent() throws Exception {

        // Publish events to per minute requests stream
        pubishEventsFromCSV(TEST_RESOURCE_PATH, TEST_REQUESTS_FILE,
                getStreamId(REQUESTS_PER_MINUTE_STREAM_NAME, REQUESTS_PER_MINUTE_STREAM_VERSION), 1);
        Thread.sleep(5000);
        // Publish events to per minute responses stream
        pubishEventsFromCSV(TEST_RESOURCE_PATH, TEST_RESPONSES_FILE,
                getStreamId(RESPONSES_PER_MINUTE_STREAM_NAME, RESPONSES_PER_MINUTE_STREAM_VERSION), 1);
        Thread.sleep(5000);
        // Publish events to per second execution times stream
        pubishEventsFromCSV(TEST_RESOURCE_PATH, TEST_EXECUTION_TIMES_FILE,
                getStreamId(EXECUTION_TIMES_PER_MINUTE_STREAM_NAME, EXECUTION_TIMES_PER_MINUTE_STREAM_VERSION), 1);
        Thread.sleep(5000);

        int i = 0;
        boolean eventsPublishedPerMinuteRequests = false;
        long requestsPerMinuteEventCount = 0;
        while (i < MAX_TRIES) {
            requestsPerMinuteEventCount = getRecordCount(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST);
            eventsPublishedPerMinuteRequests = (requestsPerMinuteEventCount >= 4);
            if (eventsPublishedPerMinuteRequests) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }
        Assert.assertTrue(eventsPublishedPerMinuteRequests,
                "Simulation events did not get published to requests per minute stream, expected entry count:4 but found: "
                        + requestsPerMinuteEventCount + "!");

        i = 0;
        boolean eventsPublishedPerMinuteResponses = false;
        long responsesPerMinuteEventCount = 0;
        while (i < MAX_TRIES) {
            responsesPerMinuteEventCount = getRecordCount(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE);
            eventsPublishedPerMinuteResponses = (responsesPerMinuteEventCount >= 4);
            if (eventsPublishedPerMinuteResponses) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }
        Assert.assertTrue(eventsPublishedPerMinuteResponses,
                "Simulation events did not get published to responses per minute stream, expected entry count:4 but found: "
                        + responsesPerMinuteEventCount + "!");

        i = 0;
        boolean eventsPublishedPerPerSecondExecutionTimes = false;
        long executionTimesPerMinuteEventCount = 0;
        while (i < MAX_TRIES) {
            executionTimesPerMinuteEventCount = getRecordCount(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEEXECUTIONTIMES);
            eventsPublishedPerPerSecondExecutionTimes = (executionTimesPerMinuteEventCount >= 4);
            if (eventsPublishedPerPerSecondExecutionTimes) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }
        Assert.assertTrue(eventsPublishedPerPerSecondExecutionTimes,
                "Simulation events did not get published to execution times per minute stream, expected entry count:4 but found: "
                        + executionTimesPerMinuteEventCount + "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test APIM_INCREMENTAL_PROCESSING_SCRIPT Spark Script execution",
            dependsOnMethods = "testInitialSimulationDataSent")
    public void testIncrementalProcessingSparkScriptExecution() throws Exception {
        // run the script
        executeSparkScript(SPARK_SCRIPT);
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST + "!");
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST + "!");
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE + "!");
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE + "!");
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES + "!");
        Assert.assertTrue(isRecordExists(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table "
                        + ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES + "!");
    }

    public void purgeData() throws Exception {
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURREQUEST);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYREQUEST);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOURRESPONSE);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYRESPONSE);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEEXECUTIONTIMES)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERMINUTEEXECUTIONTIMES);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERHOUREXECUTIONTIMES);
        }
        if (isTableExist(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES)) {
            deleteData(-1234, ORG_WSO2_APIMGT_STATISTICS_PERDAYEXECUTIONTIMES);
        }
    }
}
