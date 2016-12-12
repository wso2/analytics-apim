package org.wso2.analytics.apim.integration.tests.apim.analytics;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

import java.util.ArrayList;
import java.util.List;

public class ApiHealthAvailabilityTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(ApiHealthAvailabilityTestCase.class);

    private final String REQUEST_STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String RESPONSE_STREAM_NAME = "org.wso2.apimgt.statistics.response";
    private final String RESPONSE_TIME_SPARK_SCRIPT = "APIMAnalytics-ResponseTime-ResponseTime-batch1";
    private final String REQUEST_COUNT_SPARK_SCRIPT = "APIMAnalytics-RequestPerApi-RequestPerAPI-batch1";
    private final String RESPONSE_COUNT_SPARK_SCRIPT = "APIMAnalytics-ResponsePerApiStatGenerator-ResponsePerAPIStatGenerator-batch1";
    private final String RESPONSE_PER_API_STREAM = "ORG_WSO2_ANALYTICS_APIM_RESPONSEPERMINPERAPISTREAM";
    private final String REQUEST_PER_API_STREAM = "ORG_WSO2_ANALYTICS_APIM_REQUESTPERMINPERAPISTREAM";
    private final String RESPONSE_PERCENTILE = "ORG_WSO2_ANALYTICS_APIM_RESPONSEPERAPIPERCENTILE";
    private final String REQUEST_PERCENTILE = "ORG_WSO2_ANALYTICS_APIM_REQUESTPERAPIPERCENTILE";
    private final String REQUEST_TABLE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST";
    private final String RESPONSE_TABLE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTERESPONSE";
    private final String REQUEST_STREAM_VERSION = "1.1.0";
    private final String RESPONSE_STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "healthAvailability";
    private final String PUBLISHER_FILE = "logger.xml";
    private final String RESPONSE_TIME_TABLE = "ORG_WSO2_ANALYTICS_APIM_RESPONSETIMEPERAPIPERCENTILE";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-HealthAvailabilityPerMinAlert-HealthAvailabilityPerMin-realtime1";
    private final int MAX_TRIES_RESPONSE = 50;
    private String originalExecutionPlan;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_TABLE)) {
            deleteData(-1234, RESPONSE_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_TIME_TABLE)) {
            deleteData(-1234, RESPONSE_TIME_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_PER_API_STREAM)) {
            deleteData(-1234, RESPONSE_PER_API_STREAM);
        }
        if (isTableExist(-1234, REQUEST_PER_API_STREAM)) {
            deleteData(-1234, REQUEST_PER_API_STREAM);
        }
        if (isTableExist(-1234, REQUEST_PERCENTILE)) {
            deleteData(-1234, REQUEST_PERCENTILE);
        }
        if (isTableExist(-1234, RESPONSE_PERCENTILE)) {
            deleteData(-1234, RESPONSE_PERCENTILE);
        }

        originalExecutionPlan = eventProcessorAdminServiceClient.getActiveExecutionPlan(EXECUTION_PLAN_NAME);
        redeployExecutionPlan();
    }

    public void redeployExecutionPlan() throws Exception {
        int count = getActiveExecutionPlanCount();
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        do {
            Thread.sleep(1000);
        } while(getActiveExecutionPlanCount() == count);
        
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, EXECUTION_PLAN_NAME + ".siddhiql"));
        do { // wait till it get redeployed
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != count);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        if (isTableExist(-1234, REQUEST_TABLE)) {
            deleteData(-1234, REQUEST_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_TABLE)) {
            deleteData(-1234, RESPONSE_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_TIME_TABLE)) {
            deleteData(-1234, RESPONSE_TIME_TABLE);
        }
        if (isTableExist(-1234, RESPONSE_PER_API_STREAM)) {
            deleteData(-1234, RESPONSE_PER_API_STREAM);
        }
        if (isTableExist(-1234, REQUEST_PER_API_STREAM)) {
            deleteData(-1234, REQUEST_PER_API_STREAM);
        }
        if (isTableExist(-1234, REQUEST_PERCENTILE)) {
            deleteData(-1234, REQUEST_PERCENTILE);
        }
        if (isTableExist(-1234, RESPONSE_PERCENTILE)) {
            deleteData(-1234, RESPONSE_PERCENTILE);
        }
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        addExecutionPlan(originalExecutionPlan);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testResponseTimeSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(RESPONSE_TIME_SPARK_SCRIPT), "Response time upper percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test whether the Spark Script is scheduled",
            dependsOnMethods = "testResponseTimeSparkScriptDeployment")
    public void testResponseTimeSparkScriptScheduled() throws Exception {
        Assert.assertTrue(isSparkScriptScheduled(RESPONSE_TIME_SPARK_SCRIPT), RESPONSE_TIME_SPARK_SCRIPT + " spark " +
                "script is not scheduled!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testResponseTimeSparkScriptDeployment")
    public void testResponseSimulationDataSent() throws Exception {
        //publish training data
        deleteData(-1234, REQUEST_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        deleteData(-1234, RESPONSE_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "responseSim.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 10);
        int i = 0;
        long responseEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, RESPONSE_TABLE);
            eventsPublished = (responseEventCount >= 1);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published, expected entry count:1 but found: " +responseEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if API response time too high alert is not generated for normal scenarios", dependsOnMethods = "testResponseSimulationDataSent")
    public void testResponseTimeNormalAlert() throws Exception {
        executeSparkScript(RESPONSE_TIME_SPARK_SCRIPT);
        
        int i = 0;
        boolean scriptExecuted = false;
        long percentileTableCount = 0;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            percentileTableCount = getRecordCount(-1234, RESPONSE_TIME_TABLE);
            scriptExecuted = (percentileTableCount >= 1);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted, "Spark script did not execute as expected, expected entry count:1 but found: "+percentileTableCount+ "!");
        
        logViewerClient.clearLogs();
        List<EventDto> events = getResponseEventList(2);
        pubishEvents(events, 100);
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/calc/1.0", "CalculatorAPI:v1.0",
                "CalculatorAPI", "/add?x=12&y=3", "/add", "GET", "1", "1", "20", "7", "19", "admin@carbon.super", String.valueOf(System.currentTimeMillis()),
                "carbon.super", "192.168.66.1", "admin", "DefaultApplication", "1", "FALSE", "0", "https-8243", "200","destination"});
        events.add(eventDto);
        boolean responseTimeTooHigh = isAlertReceived(0, "\"msg\":\"Response time is higher\"", 50, 1000);
        Assert.assertFalse(responseTimeTooHigh, "Response time too high for continuous 5 events, alert is received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if API response time too high", dependsOnMethods = "testResponseTimeNormalAlert")
    public void testResponseTimeTooHighAlert() throws Exception {
        logViewerClient.clearLogs();
        List<EventDto> events = getResponseEventList(5);
        pubishEvents(events, 6000);
        boolean responseTimeTooHigh = isAlertReceived(0, "api_version\":\"CalculatorAPI:v1.0\",\"apiPublisher\":\"admin@carbon.super\",\"tenantDomain\":\"carbon.super\",\"msg\":\"Response time is higher", 50, 1000);
        Assert.assertTrue(responseTimeTooHigh, "Response time too high for continuous 5 events, alert not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testResponseTimeTooHighAlert")
    public void test1stRequestCountSimulationDataSent() throws Exception {
        deleteData(-1234, REQUEST_PER_API_STREAM.replace('.', '_'));
        deleteData(-1234, RESPONSE_PER_API_STREAM.replace('.', '_'));
        deleteData(-1234, REQUEST_TABLE);
        Thread.sleep(3000);

        redeployExecutionPlan();

        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request1.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 100);
        Thread.sleep(1000);
        int i = 0;
        long requestEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            requestEventCount = getRecordCount(-1234, REQUEST_TABLE);
            eventsPublished = (requestEventCount >= 1);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation request events set one did not get published, expected entry count:1 but found: " +requestEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "test1stRequestCountSimulationDataSent")
    public void test2ndRequestCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request2.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 100);
        Thread.sleep(10000);
//        int i = 0;
//        long requestEventCount = 0;
//        boolean eventsPublished = false;
//        while (i < MAX_TRIES_RESPONSE) {
//            Thread.sleep(2000);
//            requestEventCount = getRecordCount(-1234, REQUEST_TABLE);
//            eventsPublished = (requestEventCount >= 2);
//            if (eventsPublished) {
//                break;
//            }
//            i++;
//        }
//        Assert.assertTrue(eventsPublished, "Simulation request events set two did not get published, expected entry count:2 but found: " +requestEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "test2ndRequestCountSimulationDataSent")
    public void test3rdRequestCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request3.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 100);
        Thread.sleep(10000);
//        int i = 0;
//        long requestEventCount = 0;
//        boolean eventsPublished = false;
//        while (i < MAX_TRIES_RESPONSE) {
//            Thread.sleep(2000);
//            requestEventCount = getRecordCount(-1234, REQUEST_TABLE);
//            eventsPublished = (requestEventCount >= 3);
//            if (eventsPublished) {
//                break;
//            }
//            i++;
//        }
//        Assert.assertTrue(eventsPublished, "Simulation request events set three did not get published, expected entry count:3 but found: " +requestEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the simulation data is published", dependsOnMethods = "test3rdRequestCountSimulationDataSent")
    public void test1stResponseCountSimulationDataSent() throws Exception {
        deleteData(-1234, RESPONSE_TABLE);
        Thread.sleep(2000);
        redeployExecutionPlan();
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "response.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        Thread.sleep(1000);
        int i = 0;
        long responseEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, RESPONSE_TABLE);
            eventsPublished = (responseEventCount >= 1);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation response events set one did not get published, expected entry count:1 but found: " +responseEventCount+ "!");;
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the simulation data is published", dependsOnMethods = "test1stResponseCountSimulationDataSent")
    public void test2ndResponseCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "response2.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        Thread.sleep(1000);
        int i = 0;
        long responseEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, RESPONSE_TABLE);
            eventsPublished = (responseEventCount >= 2);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation response events set two did not get published, expected entry count:2 but found: " +responseEventCount+ "!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed", dependsOnMethods = "test2ndResponseCountSimulationDataSent")
    public void testResponseCountSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(RESPONSE_COUNT_SPARK_SCRIPT), "Response count percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test whether the Spark Script is scheduled",
            dependsOnMethods = "testResponseCountSparkScriptDeployment")
    public void testResponseCountSparkScriptScheduled() throws Exception {
        Assert.assertTrue(isSparkScriptScheduled(RESPONSE_COUNT_SPARK_SCRIPT), RESPONSE_COUNT_SPARK_SCRIPT + " spark " +
                "script is not scheduled!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed", dependsOnMethods = "test3rdRequestCountSimulationDataSent")
    public void testRequestCountSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(REQUEST_COUNT_SPARK_SCRIPT), "Request count percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test whether the Spark Script is scheduled",
            dependsOnMethods = "testRequestCountSparkScriptDeployment")
    public void testRequestCountSparkScriptScheduled() throws Exception {
        Assert.assertTrue(isSparkScriptScheduled(REQUEST_COUNT_SPARK_SCRIPT), REQUEST_COUNT_SPARK_SCRIPT + " spark " +
                "script is not scheduled!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests abnormally low response count alert",
            dependsOnMethods = {"testResponseCountSparkScriptDeployment", "testRequestCountSparkScriptDeployment"})
    public void testAbnormalLowResponseCount() throws Exception {
        logViewerClient.clearLogs();
        executeSparkScript(RESPONSE_COUNT_SPARK_SCRIPT);
        executeSparkScript(REQUEST_COUNT_SPARK_SCRIPT);
        
        int i = 0;
        long responseEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, RESPONSE_PERCENTILE);
            eventsPublished = (responseEventCount >= 1);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        
        i = 0;
        responseEventCount = 0;
        eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, REQUEST_PERCENTILE);
            eventsPublished = (responseEventCount >= 1);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        
        redeployExecutionPlan();
        logViewerClient.clearLogs();
        pubishEvents(getRequestEventList(20), 10);
        pubishEvents(getResponseEventListNumApi(1), 10);
        Thread.sleep(6000);
        pubishEvents(getRequestEventList(20), 10);
        pubishEvents(getResponseEventListNumApi(1), 10);
        Thread.sleep(6000);
        boolean responseTimeTooHigh = isAlertReceived(0, "api_version\":\"NumberAPI:v1.0\",\"apiPublisher\":\"admin@carbon.super\",\"tenantDomain\":\"carbon.super\",\"msg\":\"Response count is lower", 50, 1000);
        Assert.assertTrue(responseTimeTooHigh, "Response count is too low continuously, alert not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if server error occurred", dependsOnMethods = "testAbnormalLowResponseCount")
    public void testResponseCodeAlert() throws Exception {
        logViewerClient.clearLogs();
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "responseCode.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        //Thread.sleep(8000);
        boolean responseTimeTooHigh = isAlertReceived(0, "api_version\":\"CalculatorAPI:v2.0\",\"apiPublisher\":\"admin@carbon.super\",\"tenantDomain\":\"carbon.super\",\"msg\":\"Server error occurred", 50, 1000);
        Assert.assertTrue(responseTimeTooHigh, "Server error for continuous 5 events, alert not received!");
        boolean responseTimeTooHigh2 = isAlertReceived(0, "api_version\":\"AbcAPI:v2.0\",\"apiPublisher\":\"admin@carbon.super\",\"tenantDomain\":\"carbon.super\",\"msg\":\"Server error occurred", 50, 1000);
        Assert.assertTrue(responseTimeTooHigh2, "Server error for continuous 5 events, alert not received!");
    }
    
    @Test(groups = "wso2.analytics.apim", description = "Test if a failed api becomes normal again and alert when fail again", dependsOnMethods = "testResponseCodeAlert")
    public void testAnotherApiFailure() throws Exception {
        logViewerClient.clearLogs();
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "responseCodeNormal.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        boolean responseTimeTooHigh = isAlertReceived(0, "api_version\":\"AbcAPI:v2.0\",\"apiPublisher\":\"admin@carbon.super\",\"tenantDomain\":\"carbon.super\",\"msg\":\"Server error occurred", 50, 1000);
        Assert.assertTrue(responseTimeTooHigh, "Server error for continuous 5 events, alert not received!");
        
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if server error occurred alert is not generated for normal cases", dependsOnMethods = "testAnotherApiFailure")
    public void testNoResponseCodeAlert() throws Exception {
        logViewerClient.clearLogs();
        EventDto eventDto = new EventDto();
        eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
        eventDto.setAttributeValues(new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/calc/1.0", "CalculatorAPI:v1.0",
                "CalculatorAPI", "/add?x=12&y=3", "/add", "GET", "1", "1", "40", "7", "19", "admin@carbon.super", "1456894602386",
                "carbon.super", "192.168.66.1", "admin", "DefaultApplication", "1", "FALSE", "0", "https-8243", "550", "destination"});
        for(int i=0; i<3; i++){
            publishEvent(eventDto);
        }

        boolean responseTimeTooHigh = isAlertReceived(0, "\"msg\":\"Server error occurred", 5, 2000);
        Assert.assertFalse(responseTimeTooHigh, "Server error for continuous 5 events, alert is received!");
    }


    private List<EventDto> getResponseEventList(int count) {
        List<EventDto> events = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/calc/1.0", "CalculatorAPI:v1.0",
                    "CalculatorAPI", "/add?x=12&y=3", "/add", "GET", "1", "1", "40", "7", "19", "admin@carbon.super", String.valueOf(System.currentTimeMillis()),
                    "carbon.super", "192.168.66.1", "admin", "DefaultApplication", "1", "FALSE", "0", "https-8243", "200", "destination"});
            events.add(eventDto);
        }
        return events;
    }

    private List<EventDto> getResponseEventListNumApi(int count) {
        List<EventDto> events = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/number/1.0", "NumberAPI:v1.0",
                    "NumberAPI", "/add?x=12&y=3", "/add", "GET", "1", "1", "40", "7", "19", "admin@carbon.super", String.valueOf(System.currentTimeMillis()),
                    "carbon.super", "192.168.66.1", "admin", "DefaultApplication", "1", "FALSE", "0", "https-8243", "200", "destination"});
            events.add(eventDto);
        }
        return events;
    }

    private List<EventDto> getRequestEventList(int count) {
        List<EventDto> events = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external", "s8SWbnmzQEgzMIsol7AHt9cjhEsa", "/number/1.0", "NumberAPI:v1.0",
                    "NumberAPI", "/add?x=12&y=3", "/add", "GET", "1", "1", String.valueOf(System.currentTimeMillis()), "admin@carbon.super", "carbon.super", "192.168.66.1",
                    "admin", "DefaultApplication", "1", "chrome", "Unlimited", "FALSE", "192.168.66.1", "admin"});
            events.add(eventDto);
        }
        return events;
    }

}
