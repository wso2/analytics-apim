/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.analytics.apim.integration.tests.apim.loganalyzer;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.common.clients.DataPublisherClient;
import org.wso2.analytics.apim.integration.tests.apim.analytics.APIMAnalyticsBaseTestCase;
import org.wso2.analytics.apim.integration.tests.apim.analytics.AbnormalRequestCountTestCase;
import org.wso2.carbon.databridge.commons.Event;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LoganalyzerTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(AbnormalRequestCountTestCase.class);
    private static final String STREAM_NAME = "loganalyzer";
    private static final String STREAM_VERSION = "1.0.0";
    private static final String TEST_RESOURCE_PATH = "logAnalyzerArtifacts";
    private static final String SPARK_SCRIPT = "APIM_LOGANALYZER_SCRIPT";
    private static final String LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY = "LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY";
    private static final String LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY = "LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY";
    private static final String LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY = "LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY";
    private static final String LOGANALYZER_CLASS_LEVEL_ERROR_DAILY = "LOGANALYZER_CLASS_LEVEL_ERROR_DAILY";
    private static final String LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY = "LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY";
    private static final String LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY = "LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY";
    private static final String LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY = "LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY";
    private static final String LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY = "LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY";
    private static final String LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY = "LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY";
    private static final String LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY = "LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY";
    private static final String LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY = "LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY";
    private static final String LOGANALYZER_APIKEY_STATUS = "LOGANALYZER_APIKEY_STATUS";
    private static final String LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY = "LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY";
    private static final String LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY = "LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY";
    private static final String LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY = "LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY";
    private static final String LOGANALYZER_AUDIT_LOG = "LOGANALYZER_APIM_AUDIT_LOG";
    private static final String SERVER_NAME = "serverName";
    private static final String APP_NAME = "appName";
    private static final String EVENT_TIMESTAMP = "eventTimeStamp";
    private static final String CLASS = "class";
    private static final String LEVEL = "level";
    private static final String CONTENT = "content";
    private static final String IP = "ip";
    private static final String INSTANCE = "instance";
    private static final String TRACE = "trace";
    private final int MAX_TRIES = 20;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        dataPurging();
        Thread.sleep(1000);
    }


    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        dataPurging();
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testLoganalyzerSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT), SPARK_SCRIPT + " spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testLoganalyzerSparkScriptDeployment")
    public void testLoganalyzerDataSent() throws Exception {

        //publish events
        publishEvent(TEST_RESOURCE_PATH, "wso2carbonBenchmarkLogs.csv", getStreamId(STREAM_NAME, STREAM_VERSION));
        Thread.sleep(12000);
        int i = 0;
        boolean eventsPublished = false;
        long loganalyzerEventCount = 0;
        int benchmarkLogsCount = 3;
        while (i < MAX_TRIES) {
            loganalyzerEventCount = getRecordCount(-1234, STREAM_NAME.toUpperCase());
            eventsPublished = (loganalyzerEventCount >= benchmarkLogsCount);
            if (eventsPublished) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published, expected entry count:" +
                benchmarkLogsCount + " but found: " + loganalyzerEventCount + "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test APIM_LOGANALYZER_SCRIPT Spark Script execution"
            , dependsOnMethods = "testLoganalyzerDataSent")
    public void testLoganalyzerSparkScriptExecution() throws Exception {
        //run the script
        executeSparkScript(SPARK_SCRIPT);
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_CLASS_LEVEL_ERROR_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY + "!");
        Assert.assertTrue(isRecordExists(-1234, LOGANALYZER_AUDIT_LOG, MAX_TRIES),
                "Spark script did not execute as expected, No entries found for table " + LOGANALYZER_AUDIT_LOG + "!");
    }

    private void dataPurging() throws Exception {
        if (isTableExist(-1234, STREAM_NAME.toUpperCase())) {
            deleteData(-1234, STREAM_NAME.toUpperCase());
        }
        if (isTableExist(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY)) {
            deleteData(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY)) {
            deleteData(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_WEEKLY);
        }
        if (isTableExist(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY)) {
            deleteData(-1234, LOGANALYZER_MESSAGE_LEVEL_ERROR_MONTHLY);
        }
        if (isTableExist(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_DAILY)) {
            deleteData(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY)) {
            deleteData(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_WEEKLY);
        }
        if (isTableExist(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY)) {
            deleteData(-1234, LOGANALYZER_CLASS_LEVEL_ERROR_MONTHLY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY)) {
            deleteData(-1234, LOGANALYZER_APIM_ARTIFACT_DEPLOYED_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY)) {
            deleteData(-1234, LOGANALYZER_APIM_ARTIFACT_DELETED_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY)) {
            deleteData(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY)) {
            deleteData(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_WEEKLY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY)) {
            deleteData(-1234, LOGANALYZER_APIM_MESSAGE_PROCESSING_MONTHLY);
        }
        if (isTableExist(-1234, LOGANALYZER_APIKEY_STATUS)) {
            deleteData(-1234, LOGANALYZER_APIKEY_STATUS);
        }
        if (isTableExist(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY)) {
            deleteData(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_DAILY);
        }
        if (isTableExist(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY)) {
            deleteData(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_WEEKLY);
        }
        if (isTableExist(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY)) {
            deleteData(-1234, LOGANALYZER_INVALID_LOGIN_ATTEMPT_MONTHLY);
        }
        if (isTableExist(-1234, LOGANALYZER_AUDIT_LOG)) {
            deleteData(-1234, LOGANALYZER_AUDIT_LOG);
        }
    }

    private void publishEvent(String testResourcePath, String resourceName, String streamId) throws Exception {
        List<Event> eventListFromCSV = getEventListFromCSV(getFilePath(testResourcePath, resourceName), streamId);
        DataPublisherClient dataPublisherClient = new DataPublisherClient();
        dataPublisherClient.publish(STREAM_NAME, STREAM_VERSION, eventListFromCSV);
        Thread.sleep(10000);
        dataPublisherClient.shutdown();
    }

    private List<Event> getEventListFromCSV(String file, String streamId) throws IOException {
        String line;
        String cvsSplitBy = ",";
        List<Event> eventDataToList = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            while ((line = br.readLine()) != null) {
                // use comma as separator
                String[] eventArray = line.split(cvsSplitBy, -1);
                Map<String, String> arbitraryDataMap = new HashMap<>();
                arbitraryDataMap.put(SERVER_NAME, eventArray[1]);
                arbitraryDataMap.put(APP_NAME, eventArray[2]);
                arbitraryDataMap.put(EVENT_TIMESTAMP, eventArray[3]);
                arbitraryDataMap.put(CLASS, eventArray[4]);
                arbitraryDataMap.put(LEVEL, eventArray[5]);
                arbitraryDataMap.put(CONTENT, eventArray[6]);
                arbitraryDataMap.put(IP, eventArray[7]);
                arbitraryDataMap.put(INSTANCE, eventArray[8]);
                arbitraryDataMap.put(TRACE, eventArray[9]);
                Event event = new Event(streamId, System.currentTimeMillis(), null, null, new String[]{eventArray[0]}, arbitraryDataMap);
                eventDataToList.add(event);
            }
        }
        return eventDataToList;
    }
}