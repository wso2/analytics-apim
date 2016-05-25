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

public class StakeholderEmailNotificationTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(StakeholderEmailNotificationTestCase.class);

    private final String STREAM_NAME = "org.wso2.analytics.apim.alertStakeholderInfo";
    private final String ABNORMAL_BACKEND_TIME_STREAM_NAME = "org.wso2.analytics.apim.abnormalBackendTimeAlertStream";
    private final String REQUEST_PATTERN_CHANGED_STREAM_NAME = "org.wso2.analytics.apim.requestPatternChangedStream";
    private final String STREAM_VERSION = "1.0.0";
    private final String TEST_RESOURCE_PATH = "stakeholderEmailNotification";
    private final String PUBLISHER_FILE = "logger_emailAlert.xml";
    private final String STAKEHOLDER_INFO_TABLE = "ORG_WSO2_ANALYTICS_APIM_ALERTSTAKEHOLDERINFO";
    private final int MAX_TRIES = 5;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        if (isTableExist(-1234, STAKEHOLDER_INFO_TABLE)) {
            deleteData(-1234, STAKEHOLDER_INFO_TABLE);
        }
        // deploy the publisher xml files
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, STAKEHOLDER_INFO_TABLE)) {
            deleteData(-1234, STAKEHOLDER_INFO_TABLE);
        }
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published")
    public void testStakeholdersInfoSimulationDataSent() throws Exception {
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"tom@carbon.super", "RequestPatternChanged", "abc@gmail.com,john@gmail,com", "true", "false"}
        );
        publishEvent(eventDto);

        eventDto.setEventStreamId(getStreamId(STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"abc@carbon.super", "abnormalBackendTime", "abc@gmail.com,john@gmail,com", "false", "true"}
        );
        publishEvent(eventDto);

        int i = 0;
        boolean eventsPublished = false;
        long stakeholderEventCount = 0;
        while (i < MAX_TRIES) {
            stakeholderEventCount = getRecordCount(-1234, STAKEHOLDER_INFO_TABLE);
            eventsPublished = (stakeholderEventCount == 2);
            if (eventsPublished) {
                break;
            }
            i++;
            Thread.sleep(10000);
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published, expected entry count:2 but found: "+stakeholderEventCount+ "!");

    }

    @Test(groups = "wso2.analytics.apim", description = "Test abnormalBackendTime email Alert",
            dependsOnMethods = "testStakeholdersInfoSimulationDataSent")
    public void testAbnormalBackendTimeEmailAlert() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(ABNORMAL_BACKEND_TIME_STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"CalculatorAPI:v2.0", "abc@carbon.super", "carbon.super", "/add", "GET", "65", "20.52214676764896",
                        "Abnormal backend time detected. api_version :CalculatorAPI:v2.0 apiPublisher :abc@carbon.super " +
                        "tenantDomain :carbon.super resource template :/add Http method :GET abnormal backend time: 165 " +
                        "backend time percentile 20.52214676764896", "1", "1459411825099"
                }
        );
        publishEvent(eventDto);
        boolean abnormalBackendTimeEmailAlertTriggered = isAlertReceived(0, "Unique ID: logger_emailAlert", 20 ,10000);
        Assert.assertTrue(abnormalBackendTimeEmailAlertTriggered, "Abnormal backend time email alert event not received!");

        logViewerClient.clearLogs();
        eventDto.setEventStreamId(getStreamId(ABNORMAL_BACKEND_TIME_STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"CalculatorAPI:v2.0", "tom@carbon.super", "carbon.super", "/add", "GET", "65", "20.52214676764896",
                        "Abnormal backend time detected. api_version :CalculatorAPI:v2.0 apiPublisher :tomc@carbon.super " +
                                "tenantDomain :carbon.super resource template :/add Http method :GET abnormal backend time: 165 " +
                                "backend time percentile 20.52214676764896", "1", "1459411825099"
                }
        );
        publishEvent(eventDto);
        abnormalBackendTimeEmailAlertTriggered = isAlertReceived(0, "Unique ID: logger_emailAlert", 5 ,1000);
        Assert.assertFalse(abnormalBackendTimeEmailAlertTriggered, "Abnormal backend time email alert event received!");
    }


    @Test(groups = "wso2.analytics.apim", description = "Test RequestPatternChanged email Alert",
            dependsOnMethods = "testStakeholdersInfoSimulationDataSent")
    public void testRequestPatternChangedEmailAlert() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(REQUEST_PATTERN_CHANGED_STREAM_NAME, STREAM_VERSION));
        eventDto.setAttributeValues(
                new String[]{"tom@carbon.super", "DefaultApplication", "admin", "carbon.super", "suscpicious API transition: GET " +
                        "/calc/1.0_/search to GET /calc/1.0_/pay_fraud transitionTimestamp :2016-02-18 14:15:33", "1", "1459411825099"
                }
        );
        publishEvent(eventDto);
        boolean requestPatternChangedEmailAlertTriggered = isAlertReceived(0, "Unique ID: logger_emailAlert", 20 ,10000);
        Assert.assertTrue(requestPatternChangedEmailAlertTriggered, "RequestPatternChanged email alert event not received!");
    }


}
