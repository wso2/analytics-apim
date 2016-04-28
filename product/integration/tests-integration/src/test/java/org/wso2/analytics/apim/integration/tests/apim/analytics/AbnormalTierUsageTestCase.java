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

import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.common.clients.ExecutionManagerAdminServiceClient;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.event.execution.manager.admin.dto.configuration.xsd.ParameterDTOE;
import org.wso2.carbon.event.execution.manager.admin.dto.configuration.xsd.TemplateConfigurationDTO;
import org.wso2.carbon.event.execution.manager.admin.dto.domain.xsd.TemplateDomainDTO;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

import java.rmi.RemoteException;
import java.util.Calendar;

public class AbnormalTierUsageTestCase extends APIMAnalyticsBaseTestCase {
    // General constants
    private static final String STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private static final String STREAM_VERSION = "1.1.0";
    private static final String TEST_RESOURCE_PATH = "abnormalTierUsage";
    private static final String PUBLISHER_FILE = "logger_abnormalTierUsage.xml";
    private static final String SPARK_SCRIPT = "APIMAnalytics-AbnormalTierAvailabilityAlert";

    // Request related constants these will be used to build API requests
    private static final String clientType = "external";
    private static final String consumerKey = "sqbkktg3s00vzz7gg3s198rzb9g3s2me2u2ng3s3";
    private static final String context = "http://mymlserver/algo";
    private static final String resourcePath = "train";
    private static final String resourceTemplate = "train";
    private static final String method = "POST";
    private static final String version = "1.0.0";
    private static final String userId = "1";
    private static final String tenantDomain = "-1234";
    private static final String hostName = "127.0.0.1";
    private static final String apiPublisher = "samplePublisher";
    private static final String applicationName = "sampleApplication";
    private static final String applicationId = "sampleId";
    private static final String userAgent = "Mozilla";
    private static final String tier = "Gold";
    private static final boolean throttledOut = false;
    private static final String clientIp = "127.0.0.1";
    private static final String applicationOwner = "admin";
    private final int MAX_TRIES = 20;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.REQUEST_PER_X_DAYS_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.PERCENTILE_TABEL);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALERT_STORE_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ABNORMAL_REQ_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ALL_ALERT_TABLE);
        }
        if (isTableExist(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA)) {
            deleteData(-1234, APIMAnalyticsIntegrationTestConstants.ADITIONAL_DATA);
        }
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test Abnormal Tier Usage Alert")
    public void testAbnormalTierUsageAlert() throws Exception {

        TemplateConfigurationDTO testDomain = executionManagerAdminServiceClient.getConfiguration("APIMAnalytics",
                "AbnormalTierAvailabilityAlert");

        if (testDomain == null) {
            Assert.fail("Domain is not loaded");
        } else {
            ParameterDTOE[] parameters = testDomain.getParameterDTOs();
            for (ParameterDTOE parameter : parameters) {
                if (parameter.getName().equalsIgnoreCase("receiverURLPort")) {
                    parameter.setValue("8311");
                } else if (parameter.getName().equalsIgnoreCase("authURLPort")) {
                    parameter.setValue("8411");
                }
            }

        }
        executionManagerAdminServiceClient.saveConfiguration(testDomain);

        publishDataset();
        logViewerClient.clearLogs();

        int i = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            long requestPerMinuteEventCount = getRecordCount(-1234, STREAM_NAME.replace('.', '_'));
            eventsPublished = (requestPerMinuteEventCount >= 1332);
            if (eventsPublished) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }

        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");

        // this is a synchronous call

        executeSparkScript(SPARK_SCRIPT);

        // test case #1
        boolean testOne = isAlertReceived(
                0,
                "sampleApplication Application owned by admin is consuming too less of the allowed quota when accessing the svm API version svm:v1.0.0. It currently uses a Gold subscription.",
                10, 1000);
        Assert.assertTrue(testOne,
                "Abnormal request alert is not received for application: sampleApplication for api_version: svm:v1.0.0");

        // test case #2
        boolean testTwo = isAlertReceived(
                0,
                "sampleApplication Application owned by admin is consuming too less of the allowed quota when accessing the tree API version tree:v1.0.0. It currently uses a Gold subscription.",
                10, 1000);
        Assert.assertFalse(testTwo,
                "Incorrect user alert is received for application: sampleApplication for api_version: tree:v1.0.0");

        // test case #3
        boolean testThree = isAlertReceived(
                0,
                "sampleApplication2 Application owned by admin is consuming too less of the allowed quota when accessing the svm API version svm:v1.0.0. It currently uses a Gold subscription.",
                10, 1000);
        Assert.assertTrue(testThree,
                "Abnormal request alert is not received for application: sampleApplication2 for api_version: svm:v1.0.0");

        // test case #4
        boolean testFour = isAlertReceived(
                0,
                "sampleApplication Application owned by admin is consuming too less of the allowed quota when accessing the boost API version boost:v1.1.0. It currently uses a Gold subscription.",
                10, 1000);
        Assert.assertTrue(testFour,
                "Abnormal request alert is not received for application: sampleApplication for api_version: boost:v1.1.0");

    }

    private void publishDataset() throws Exception {

        // for a given applicationId, api_version, last five days average daily
        // usage
        // is less than 0.05th percentile of its last 30 days average daily
        // usage.
        for (int day = 0; day < 30; day++) {
            int maxLimit = (day < 5) ? 2 : 10;
            for (int request = 0; request < maxLimit; request++) {
                EventDto eventDto = new EventDto();
                eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));

                long requestTime = offsetInDays(-day);
                String[] currentReq = buildRequst(clientType, consumerKey, context, "svm:v1.0.0", "svm", resourcePath,
                        resourceTemplate, method, version, request, requestTime, userId, tenantDomain, hostName,
                        apiPublisher, applicationName, applicationId, userAgent, tier, throttledOut, clientIp,
                        applicationOwner);
                eventDto.setAttributeValues(currentReq);
                publishEvent(eventDto);
                Thread.sleep(10);
            }
        }

        // for a given applicationId, api_version, last 4 days ( hence should
        // not
        // receive an alert)
        // average daily usage is less
        // than 0.05th percentile of its last 30 days average daily usage.
        for (int day = 0; day < 30; day++) {
            int maxLimit = (day < 4) ? 2 : 10;
            for (int request = 0; request < maxLimit; request++) {
                EventDto eventDto = new EventDto();
                eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));

                long requestTime = offsetInDays(-day);
                String[] currentReq = buildRequst(clientType, consumerKey, context, "tree:v1.0.0", "tree",
                        resourcePath, resourceTemplate, method, version, request, requestTime, userId, tenantDomain,
                        hostName, apiPublisher, applicationName, applicationId, userAgent, tier, throttledOut,
                        clientIp, applicationOwner);
                eventDto.setAttributeValues(currentReq);
                publishEvent(eventDto);
                Thread.sleep(10);
            }
        }

        // adding another abnormal API but for a different applicationId
        // in this cases also we should get an alert for new applicationIs as
        // well.
        for (int day = 0; day < 30; day++) {
            int maxLimit = (day < 5) ? 2 : 10;
            for (int request = 0; request < maxLimit; request++) {
                EventDto eventDto = new EventDto();
                eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));

                long requestTime = offsetInDays(-day);
                String[] currentReq = buildRequst(clientType, consumerKey, context, "svm:v1.0.0", "svm", resourcePath,
                        resourceTemplate, method, version, request, requestTime, userId, tenantDomain, hostName,
                        apiPublisher, "sampleApplication2", "sampleId2", userAgent, tier, throttledOut, clientIp,
                        applicationOwner);
                eventDto.setAttributeValues(currentReq);
                publishEvent(eventDto);
                Thread.sleep(10);
            }
        }

        // Same API but two API versions and one shows an abnormal behavior
        // abnormal
        for (int day = 0; day < 30; day++) {
            int maxLimit = (day < 5) ? 2 : 10;
            for (int request = 0; request < maxLimit; request++) {
                EventDto eventDto = new EventDto();
                eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));

                long requestTime = offsetInDays(-day);
                String[] currentReq = buildRequst(clientType, consumerKey, context, "boost:v1.1.0", "boost",
                        resourcePath, resourceTemplate, method, version, request, requestTime, userId, tenantDomain,
                        hostName, apiPublisher, applicationName, applicationId, userAgent, tier, throttledOut,
                        clientIp, applicationOwner);
                eventDto.setAttributeValues(currentReq);
                publishEvent(eventDto);
                Thread.sleep(10);
            }
        }
        // not abnormal
        for (int day = 0; day < 30; day++) {
            int maxLimit = (day < 2) ? 2 : 10;
            for (int request = 0; request < maxLimit; request++) {
                EventDto eventDto = new EventDto();
                eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));

                long requestTime = offsetInDays(-day);
                String[] currentReq = buildRequst(clientType, consumerKey, context, "boost:v1.0.0", "boost",
                        resourcePath, resourceTemplate, method, version, request, requestTime, userId, tenantDomain,
                        hostName, apiPublisher, applicationName, applicationId, userAgent, tier, throttledOut,
                        clientIp, applicationOwner);
                eventDto.setAttributeValues(currentReq);
                publishEvent(eventDto);
                Thread.sleep(10);
            }
        }

    }

    private void initExecutionManagerAdminServiceClient() throws Exception {

        String loggedInSessionCookie = getSessionCookie();
        executionManagerAdminServiceClient = new ExecutionManagerAdminServiceClient(backendURL, loggedInSessionCookie);
        ServiceClient client = executionManagerAdminServiceClient._getServiceClient();
        Options options = client.getOptions();
        options.setManageSession(true);
        options.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, loggedInSessionCookie);
    }

    private long offsetInDays(Integer numOfDays) {
        if (numOfDays == null) {
            throw new RuntimeException("numOfDays can't be null");
        }

        Calendar calender = Calendar.getInstance();
        calender.add(Calendar.DAY_OF_MONTH, numOfDays);
        return calender.getTimeInMillis();
    }

    private String[] buildRequst(String clientType, String consumerKey, String context, String api_version, String api,
            String resourcePath, String resourceTemplate, String method, String version, int request, long requestTime,
            String userId, String tenantDomain, String hostName, String apiPublisher, String applicationName,
            String applicationId, String userAgent, String tier, boolean throttledOut, String clientIp,
            String applicationOwner) {

        String[] singleRequest = new String[22];

        singleRequest[0] = clientType;
        singleRequest[1] = consumerKey;
        singleRequest[2] = context;
        singleRequest[3] = api_version;
        singleRequest[4] = api;
        singleRequest[5] = resourcePath;
        singleRequest[6] = resourceTemplate;
        singleRequest[7] = method;
        singleRequest[8] = version;
        singleRequest[9] = Integer.toString(request);
        singleRequest[10] = Long.toString(requestTime);
        singleRequest[11] = userId;
        singleRequest[12] = tenantDomain;
        singleRequest[13] = hostName;
        singleRequest[14] = apiPublisher;
        singleRequest[15] = applicationName;
        singleRequest[16] = applicationId;
        singleRequest[17] = userAgent;
        singleRequest[18] = tier;
        singleRequest[19] = Boolean.toString(throttledOut);
        singleRequest[20] = clientIp;
        singleRequest[21] = applicationOwner;

        return singleRequest;
    }

}
