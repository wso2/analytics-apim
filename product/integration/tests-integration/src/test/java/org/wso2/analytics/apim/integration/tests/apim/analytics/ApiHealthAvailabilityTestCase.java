package org.wso2.analytics.apim.integration.tests.apim.analytics;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.event.simulator.stub.types.EventDto;

import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.List;

public class ApiHealthAvailabilityTestCase extends APIMAnalyticsBaseTestCase {
    private static final Log log = LogFactory.getLog(ApiHealthAvailabilityTestCase.class);

    private final String REQUEST_STREAM_NAME = "org.wso2.apimgt.statistics.request";
    private final String RESPONSE_STREAM_NAME = "org.wso2.apimgt.statistics.response";
    private final String RESPONSE_TIME_SPARK_SCRIPT = "APIMAnalytics-ResponseTime";
    private final String REQUEST_COUNT_SPARK_SCRIPT = "APIMAnalytics-RequestPerAPI";
    private final String RESPONSE_COUNT_SPARK_SCRIPT = "APIMAnalytics-ResponsePerAPIStatGenerator";
    private final String RESPONSE_PER_API_STREAM = "ORG_WSO2_ANALYTICS_APIM_RESPONSEPERMINPERAPISTREAM";
    private final String REQUEST_PER_API_STREAM = "ORG_WSO2_ANALYTICS_APIM_REQUESTPERMINPERAPISTREAM";
    private final String REQUEST_STREAM_VERSION = "1.1.0";
    private final String RESPONSE_STREAM_VERSION = "1.1.0";
    private final String TEST_RESOURCE_PATH = "healthAvailability";
    private final String PUBLISHER_FILE = "logger.xml";
    private final String RESPONSE_TIME_TABLE = "ORG_WSO2_ANALYTICS_APIM_RESPONSETIMEPERAPIPERCENTILE";
    private final String EXECUTION_PLAN_NAME = "APIMAnalytics-HealthAvailabilityPerMin";
    private final int MAX_TRIES_RESPONSE = 50;
    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        deleteExecutionPlan(EXECUTION_PLAN_NAME);
        Thread.sleep(1000);
        addExecutionPlan(getExecutionPlanFromFile(TEST_RESOURCE_PATH, EXECUTION_PLAN_NAME + ".siddhiql"));
        Thread.sleep(1000);
       // editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME),EXECUTION_PLAN_NAME);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws RemoteException {
        // undeploy the publishers
       /* deleteData(-1234, REQUEST_STREAM_NAME.replace('.', '_'));
        Thread.sleep(5000);
        deleteData(-1234, RESPONSE_STREAM_NAME.replace('.', '_'));
        Thread.sleep(5000);*/
        undeployPublisher(PUBLISHER_FILE);
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed")
    public void testResponseTimeSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(RESPONSE_TIME_SPARK_SCRIPT), "Response time upper percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testResponseTimeSparkScriptDeployment")
    public void testResponseSimulationDataSent() throws Exception {
        //publish training data
        deleteData(-1234, REQUEST_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        deleteData(-1234, RESPONSE_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "responseSim.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        int i = 0;
        long responseEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES_RESPONSE) {
            Thread.sleep(2000);
            responseEventCount = getRecordCount(-1234, RESPONSE_STREAM_NAME.replace('.', '_'));
            eventsPublished = (responseEventCount == 50);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished, "Simulation events did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if API response time too high", dependsOnMethods = "testResponseSimulationDataSent")
    public void testResponseTimeTooHighAlert() throws Exception {
        executeSparkScript(RESPONSE_TIME_SPARK_SCRIPT);
        Thread.sleep(5000);
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;
        List<EventDto> events = getResponseEventList(5);
        pubishEvents(events,1000);
        //Thread.sleep(6000);
        boolean responseTimeTooHigh = isAlertReceived(beforeCount, "\"msg\":\"Response time is too high\"",50,2000);
        Assert.assertTrue(responseTimeTooHigh, "Response time too high for continuous 5 events, alert not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "testResponseTimeTooHighAlert")
    public void test1stRequestCountSimulationDataSent() throws Exception {
        deleteData(-1234, REQUEST_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        deleteData(-1234, RESPONSE_PER_API_STREAM.replace('.', '_'));
        Thread.sleep(2000);
        deleteData(-1234, REQUEST_STREAM_NAME.replace('.', '_'));
        Thread.sleep(6000);
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request1.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 500);
        Thread.sleep(12000);
        long requestEventCount = getRecordCount(-1234, REQUEST_STREAM_NAME.replace('.', '_'));
        boolean eventsPublished = false;
        eventsPublished =(requestEventCount==9);
        Assert.assertTrue(eventsPublished, "Simulation request events set one did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "test1stRequestCountSimulationDataSent")
    public void test2ndRequestCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request2.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 500);
        Thread.sleep(8000);
        long requestEventCount = getRecordCount(-1234, REQUEST_STREAM_NAME.replace('.', '_'));
        boolean eventsPublished = false;
        eventsPublished =(requestEventCount==22);
        Assert.assertTrue(eventsPublished, "Simulation request events set two did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if the Simulation data has been published"
            , dependsOnMethods = "test2ndRequestCountSimulationDataSent")
    public void test3rdRequestCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "request3.csv", getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION), 500);
        Thread.sleep(8000);
        long requestEventCount = getRecordCount(-1234, REQUEST_STREAM_NAME.replace('.', '_'));
        boolean eventsPublished = false;
        eventsPublished =(requestEventCount==37);
        Assert.assertTrue(eventsPublished, "Simulation request events set three did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the simulation data is published", dependsOnMethods = "test3rdRequestCountSimulationDataSent")
    public void test1stResponseCountSimulationDataSent() throws Exception {
        deleteData(-1234, RESPONSE_STREAM_NAME.replace('.', '_'));
        Thread.sleep(4000);
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "response.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        Thread.sleep(15000);
        long requestEventCount = getRecordCount(-1234, RESPONSE_STREAM_NAME.replace('.', '_'));
        boolean eventsPublished = false;
        eventsPublished =(requestEventCount==9);
        Assert.assertTrue(eventsPublished, "Simulation response events set one did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the simulation data is published", dependsOnMethods = "test1stResponseCountSimulationDataSent")
    public void test2ndResponseCountSimulationDataSent() throws Exception {
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "response2.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        Thread.sleep(8000);
        long requestEventCount = getRecordCount(-1234, RESPONSE_STREAM_NAME.replace('.', '_'));
        boolean eventsPublished = false;
        eventsPublished =(requestEventCount==22);
        Assert.assertTrue(eventsPublished, "Simulation response events set two did not get published!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed", dependsOnMethods = "test2ndResponseCountSimulationDataSent")
    public void testResponseCountSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(RESPONSE_COUNT_SPARK_SCRIPT), "Response count percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests if the Spark script is deployed", dependsOnMethods = "test3rdRequestCountSimulationDataSent")
    public void testRequestCountSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(REQUEST_COUNT_SPARK_SCRIPT), "Request count percentile generating " +
                "spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Tests abnormally low response count alert",
            dependsOnMethods = {"testResponseCountSparkScriptDeployment","testRequestCountSparkScriptDeployment"})
    public void testAbnormalLowResponseCount() throws Exception {
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;
        executeSparkScript(RESPONSE_COUNT_SPARK_SCRIPT);
        executeSparkScript(REQUEST_COUNT_SPARK_SCRIPT);
        Thread.sleep(10000);
        pubishEvents(getRequestEventList(10),1000);
        pubishEvents(getResponseEventListNumApi(1),1000);
        Thread.sleep(6000);
        pubishEvents(getRequestEventList(10),500);
        pubishEvents(getResponseEventListNumApi(1),500);
        //Thread.sleep(5000);
        /*Thread.sleep(49000);
        pubishEvents(getRequestEventList(10),1000);
        pubishEvents(getResponseEventListNumApi(1),1000);*/
        boolean responseTimeTooHigh = isAlertReceived(beforeCount, "\"msg\":\"Response count is too low\",",50,2000);
        Assert.assertTrue(responseTimeTooHigh, "Response count is too low continuously, alert not received!");
    }

    @Test(groups = "wso2.analytics.apim", description = "Test if server error occurred", dependsOnMethods = "testAbnormalLowResponseCount")
    public void testResponseCodeAlert() throws Exception {
        int beforeCount = logViewerClient.getAllRemoteSystemLogs().length;
        pubishEventsFromCSV(TEST_RESOURCE_PATH, "responseCode.csv", getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION), 100);
        //Thread.sleep(8000);
        boolean responseTimeTooHigh = isAlertReceived(beforeCount, "\"msg\":\"Server error occurred\"",50,2000);
        Assert.assertTrue(responseTimeTooHigh, "Server error for continuous 5 events, alert not received!");
    }

    private List<EventDto> getResponseEventList (int count){
        List<EventDto> events = new ArrayList<>();
        for(int i = 0;i<count; i++){
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external","s8SWbnmzQEgzMIsol7AHt9cjhEsa","/calc/1.0","CalculatorAPI:v1.0",
                    "CalculatorAPI", "/add?x=12&y=3","/add","GET","1","1","40","7","19","admin@carbon.super","1456894602386",
                    "carbon.super","192.168.66.1","admin@carbon.super","DefaultApplication","1","FALSE","0","https-8243","200"});
            events.add(eventDto);
        }
        return events;
    }
    private List<EventDto> getResponseEventListNumApi (int count){
        List<EventDto> events = new ArrayList<>();
        for(int i = 0;i<count; i++){
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(RESPONSE_STREAM_NAME, RESPONSE_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external","s8SWbnmzQEgzMIsol7AHt9cjhEsa","/calc/1.0","NumberAPI:v1.0",
                    "NumberAPI", "/add?x=12&y=3","/add","GET","1","1","40","7","19","admin@carbon.super","1456894602386",
                    "carbon.super","192.168.66.1","admin@carbon.super","DefaultApplication","1","FALSE","0","https-8243","200"});
            events.add(eventDto);
        }
        return events;
    }

    private List<EventDto> getRequestEventList (int count){
        List<EventDto> events = new ArrayList<>();
        for(int i = 0;i<count; i++){
            EventDto eventDto = new EventDto();
            eventDto.setEventStreamId(getStreamId(REQUEST_STREAM_NAME, REQUEST_STREAM_VERSION));
            eventDto.setAttributeValues(new String[]{"external","s8SWbnmzQEgzMIsol7AHt9cjhEsa","/number/1.0","NumberAPI:v1.0",
                    "NumberAPI","/add?x=12&y=3","/add","GET","1","1","1455785133394","admin@carbon.super","carbon.super","192.168.66.1",
                    "admin@carbon.super","DefaultApplication","1","chrome","Unlimited","FALSE","192.168.66.1","admin"});
            events.add(eventDto);
        }
        return events;
    }

}
