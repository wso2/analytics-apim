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

import org.apache.axiom.om.OMElement;
import org.apache.axiom.om.impl.builder.StAXOMBuilder;
import org.apache.axis2.AxisFault;
import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import org.apache.axis2.context.ConfigurationContext;
import org.apache.axis2.context.ConfigurationContextFactory;
import org.testng.Assert;
import org.wso2.analytics.apim.integration.common.clients.*;
import org.wso2.analytics.apim.integration.common.utils.CSVSimulatorUtil;
import org.wso2.analytics.apim.integration.common.utils.DASIntegrationTest;
import org.wso2.analytics.apim.integration.common.utils.SiddhiSimulatorUtil;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.analytics.api.AnalyticsDataAPI;
import org.wso2.carbon.analytics.api.CarbonAnalyticsAPI;
import org.wso2.carbon.analytics.datasource.commons.exception.AnalyticsException;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceStub;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ConfigurationParameterDTO;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ScenarioConfigurationDTO;
import org.wso2.carbon.event.simulator.stub.types.EventDto;
import org.wso2.carbon.integration.common.admin.client.LogViewerClient;
import org.wso2.carbon.logging.view.stub.LogViewerLogViewerException;
import org.wso2.carbon.logging.view.stub.types.carbon.LogEvent;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.rmi.RemoteException;
import java.util.List;
import java.util.regex.Matcher;

public class APIMAnalyticsBaseTestCase extends DASIntegrationTest {
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private static final String REQUEST_SUMMARIZER = "APIMAnalytics-RequestSummarizer-RequestSummarizer-realtime1";
    private DataPublisherClient dataPublisherClient;
    private AnalyticsDataAPI analyticsDataAPI;
    private AnalyticsProcessorAdminServiceStub analyticsStub;
    private SiddhiSimulatorUtil siddhiSimulatorUtil;
    protected EventPublisherAdminServiceClient eventPublisherAdminServiceClient;
    protected TemplateManagerAdminServiceClient templateManagerAdminServiceClient;
    protected LogViewerClient logViewerClient;
    protected EventSimulatorAdminServiceClient eventSimulatorAdminServiceClient;
    protected EventProcessorAdminServiceClient eventProcessorAdminServiceClient;

    public void init() throws Exception {
        super.init();
        String session = getSessionCookie();
        siddhiSimulatorUtil = new SiddhiSimulatorUtil();
        eventPublisherAdminServiceClient = getEventPublisherAdminServiceClient(backendURL, session);
        templateManagerAdminServiceClient = getTemplateManagerAdminServiceClient(backendURL, session);
        eventProcessorAdminServiceClient = getEventProcessorAdminServiceClien(backendURL,session);
        logViewerClient = new LogViewerClient(backendURL, session);
        String apiConf =
                new File(this.getClass().getClassLoader().
                        getResource("dasconfig" + File.separator + "analytics-data-config.xml").toURI()).getAbsolutePath();
        analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
        eventSimulatorAdminServiceClient = getEventSimulatorAdminServiceClient(backendURL, session);
        initializeStub();
        
        int count = getActiveExecutionPlanCount();
        
        deleteExecutionPlan(REQUEST_SUMMARIZER);
        
        // configuring the entry point 
        ScenarioConfigurationDTO apimAnalyticsExecutionPlan = getConfiguration("APIMAnalytics", "RequestSummarizer");
        ConfigurationParameterDTO[] params = apimAnalyticsExecutionPlan.getConfigurationParameterDTOs();
        // set time interval of summarization to 5 seconds
        if ((params[0].getName()).equals("schedulerTimeInterval")) {
            params[0].setValue("1");
            params[1].setValue("5");
        } else {
            params[0].setValue("5");
            params[1].setValue("1");
        }
        apimAnalyticsExecutionPlan.setConfigurationParameterDTOs(params);
        saveConfiguration(apimAnalyticsExecutionPlan);
        do { // wait till it get redeployed
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != count);
        
    }

    /**
     * Publishes given set of events. Events are in EventDto format.
     * @param events EventDto list.
     * @param timeGapBetweenEvents time between two events in milliseconds.
     * @throws Exception
     */
    protected void pubishEvents(List<EventDto> events, long timeGapBetweenEvents) throws Exception {
        for (int i = 0; i < events.size(); i++) {
            eventSimulatorAdminServiceClient.sendEvent(events.get(i));
            Thread.sleep(timeGapBetweenEvents);
        }
    }

    /**
     * Sends a single event.
     * @param eventDto EventDTO of the event.
     * @throws RemoteException
     */
    protected void publishEvent(EventDto eventDto) throws RemoteException {
        eventSimulatorAdminServiceClient.sendEvent(eventDto);
    }

    /**
     * Returns the table count of an INDEXED table.
     * @param tenantId ID of the tenant.
     * @param tableName name of the Table.
     * @return number of records in the table.
     * @throws AnalyticsException
     */
    protected long getRecordCount(int tenantId, String tableName) throws AnalyticsException {
        return analyticsDataAPI.searchCount(tenantId, tableName, "");
    }

    /**
     * Publishes events from a given csv file.
     * @param testResourcePath test resources folder.
     * @param resourceName name of the file.
     * @param streamId stream ID
     * @param timeGapBetweenEvents Time difference between sending of two events.
     * @throws Exception
     */
    protected void pubishEventsFromCSV(String testResourcePath, String resourceName, String streamId,
                                       long timeGapBetweenEvents) throws Exception {
        List<EventDto> eventListFromCSV = CSVSimulatorUtil.getEventListFromCSV(getFilePath(testResourcePath, resourceName), streamId);
        pubishEvents(eventListFromCSV, timeGapBetweenEvents);
    }

    /**
     * Deploys a given publisher for a stream.
     * @param testResourcePath test resources folder.
     * @param publisherFileName publisher file name.
     * @throws Exception
     */
    protected void deployPublisher(String testResourcePath, String publisherFileName) throws Exception {
        int startEPCount = eventPublisherAdminServiceClient.getActiveEventPublisherCount();
        String eventPublisherConfig = getXMLArtifactConfiguration(testResourcePath, publisherFileName);
        eventPublisherAdminServiceClient.addEventPublisherConfiguration(eventPublisherConfig);
        Assert.assertEquals(eventPublisherAdminServiceClient.getActiveEventPublisherCount(), startEPCount + 1);
    }

    /**
     * Undeploys a given publisher of a stream.
     * @param publisherFileName publisher file name.
     * @throws RemoteException
     */
    protected void undeployPublisher(String publisherFileName) throws RemoteException {
        eventPublisherAdminServiceClient.removeInactiveEventPublisherConfiguration(publisherFileName);
    }

    /**
     * Delete data from a given table.
     * @param tenantId Tenant ID.
     * @param tableName Name of the Table.
     * @throws AnalyticsException
     */
    protected void deleteData(int tenantId, String tableName) throws AnalyticsException{
        analyticsDataAPI.delete(tenantId, tableName, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    /**
     * Know if a table exists or not.
     * @param tenantId Tenant ID of the table.
     * @param tableName name of the Table.
     * @return true if a table exists with that name.
     * @throws AnalyticsException
     */
    protected boolean isTableExist(int tenantId, String tableName) throws AnalyticsException {
        return analyticsDataAPI.tableExists(tenantId, tableName);
    }

    /**
     * Executes a given spark script.
     * @param scriptName name of the Spark Script.
     * @throws Exception
     */
    protected void executeSparkScript(String scriptName) throws Exception{
        analyticsStub.executeScript(scriptName);
    }

    /**
     * Returns true if the Spark Script exists in the server.
     * @param scriptName Name of the spark script.
     * @return
     * @throws RemoteException
     * @throws AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException
     */
    protected boolean isSparkScriptExists(String scriptName) throws RemoteException, AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException {
        AnalyticsProcessorAdminServiceStub.AnalyticsScriptDto[] scriptDtos = analyticsStub.getAllScripts();
        if (scriptDtos != null){
            for (AnalyticsProcessorAdminServiceStub.AnalyticsScriptDto scriptDto: scriptDtos){
                if (scriptDto.getName().equalsIgnoreCase(scriptName)){
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Reads through the logs and determines if the given string is in the logs.
     * @param beforeCount Log count before.
     * @param message message to look for in the logs.
     * @return whether the string exists in the log.
     * @throws RemoteException
     * @throws LogViewerLogViewerException
     */
    protected boolean isAlertReceived(int beforeCount, String message, int maxRetries, long sleepTime) throws RemoteException, LogViewerLogViewerException, InterruptedException {
        boolean alertReceived = false;
        int j = 0;
        while (j < maxRetries) {
            Thread.sleep(sleepTime);
            LogEvent[] logs = logViewerClient.getAllRemoteSystemLogs();
            if (logs == null) {
                j++;
                continue;
            }
            for (int i = 0; i < (logs.length - beforeCount); i++) {
                if (logs[i].getMessage().contains(message)) {
                    alertReceived = true;
                    break;
                }
            }
            if(alertReceived){
                break;
            }
            beforeCount = logs.length;
            j++;
        }
        return alertReceived;
    }

    /**
     * Returns the stream id of a stream.
     * @param streamName name of the stream.
     * @param streamVersion version of the stream.
     * @return stream ID.
     */
    protected String getStreamId(String streamName, String streamVersion) {
        return streamName + ":" + streamVersion;
    }

    /**
     * Gives the absolute path of the given test resource.
     * @param testCaseFolderName folder relative to the test resources root.
     * @param configFileName file name.
     * @return absolute path of the file.
     */
    protected String getFilePath(String testCaseFolderName, String configFileName) {
        String relativeFilePath = getTestArtifactLocation() +
                APIMAnalyticsIntegrationTestConstants.RELATIVE_PATH_TO_TEST_ARTIFACTS + testCaseFolderName + "/"
                + configFileName;
        return relativeFilePath;
    }

    /**
     * Publishes a single event.
     * @param streamName name of the stream.
     * @param streamVersion version of the stream.
     * @param event event.
     * @throws Exception
     */
    protected void publishEvent(String streamName, String streamVersion, Event event) throws Exception {
        dataPublisherClient = new DataPublisherClient();
        dataPublisherClient.publish(streamName, streamVersion, event);
        Thread.sleep(1000);
        dataPublisherClient.shutdown();
    }

    /**
     * Publishes a given set of events.
     * @param streamName name of the stream.
     * @param streamVersion version of the stream.
     * @param events list of events.
     * @throws Exception
     */
    protected void pubishEvents(String streamName, String streamVersion, List<Event> events) throws Exception {
        dataPublisherClient = new DataPublisherClient();
        dataPublisherClient.publish(streamName, streamVersion, events);
        Thread.sleep(5000);
        dataPublisherClient.shutdown();
    }
    /**
     * @param testCaseFolderName Name of the folder created under /artifacts/CEP for the particular test case.
     * @param configFileName     Name of the XML config-file created under above folder.
     * @return The above XML-configuration, as a string.
     * @throws Exception
     */
    protected String getXMLArtifactConfiguration(String testCaseFolderName, String configFileName)
            throws Exception {
        String relativeFilePath = getTestArtifactLocation() + APIMAnalyticsIntegrationTestConstants.RELATIVE_PATH_TO_TEST_ARTIFACTS + testCaseFolderName + "/"
                + configFileName;
        relativeFilePath = relativeFilePath.replaceAll("[\\\\/]", Matcher.quoteReplacement(File.separator));
        OMElement configElement = loadClasspathResourceXML(relativeFilePath);
        return configElement.toString();
    }

    protected void saveConfiguration(ScenarioConfigurationDTO templateConfigDTO) throws RemoteException {
        templateManagerAdminServiceClient.saveConfiguration(templateConfigDTO);
    }

//    protected ParameterDTOE getParameterDTO(String name, String defaultValue, String type){
//        ParameterDTOE parameterDTO = new ParameterDTOE();
//        parameterDTO.setName(name);
//        parameterDTO.setDefaultValue(defaultValue);
//        parameterDTO.setType(type);
//        return parameterDTO;
//    }

    protected ScenarioConfigurationDTO getConfiguration (String domainName, String configurationName) throws RemoteException {
        return templateManagerAdminServiceClient.getConfiguration(domainName,configurationName);
    }

    private String getTestArtifactLocation() {
        return FrameworkPathUtil.getSystemResourceLocation();
    }

    private OMElement loadClasspathResourceXML(String path) throws FileNotFoundException, XMLStreamException {
        OMElement documentElement = null;
        FileInputStream inputStream = null;
        XMLStreamReader parser = null;
        StAXOMBuilder builder = null;
        File file = new File(path);
        if (file.exists()) {
            try {
                inputStream = new FileInputStream(file);
                parser = XMLInputFactory.newInstance().createXMLStreamReader(inputStream);
                //create the builder
                builder = new StAXOMBuilder(parser);
                //get the root element (in this case the envelope)
                documentElement = builder.getDocumentElement().cloneOMElement();
            } finally {
                if (builder != null) {
                    builder.close();
                }
                if (parser != null) {
                    try {
                        parser.close();
                    } catch (XMLStreamException e) {
                        //ignore
                    }
                }
                if (inputStream != null) {
                    try {
                        inputStream.close();
                    } catch (IOException e) {
                        //ignore
                    }
                }
            }
        } else {
            throw new FileNotFoundException("File does not exist at " + path);
        }
        return documentElement;
    }

    protected EventPublisherAdminServiceClient getEventPublisherAdminServiceClient(
            String backendURL, String loggedInSessionCookie) throws AxisFault {
        initEventPublisherAdminServiceClient(backendURL, loggedInSessionCookie);
        return eventPublisherAdminServiceClient;
    }

    protected TemplateManagerAdminServiceClient getTemplateManagerAdminServiceClient(
            String backendURL, String loggedInSessionCookie) throws AxisFault {
        initTemplateManagerAdminServiceClient(backendURL, loggedInSessionCookie);
        return templateManagerAdminServiceClient;
    }

    protected EventProcessorAdminServiceClient getEventProcessorAdminServiceClien(
            String backEndURL, String loggedInSessionCookie) throws AxisFault{
        initEventProcessorAdminServiceClient(backEndURL,loggedInSessionCookie);
        return eventProcessorAdminServiceClient;
    }

    private void initEventProcessorAdminServiceClient(String backEndURL,String loggedInSessionCookie) throws AxisFault {
        eventProcessorAdminServiceClient = new EventProcessorAdminServiceClient(backEndURL,loggedInSessionCookie);
        ServiceClient client = eventProcessorAdminServiceClient._getServiceClient();
        Options options = client.getOptions();
        options.setManageSession(true);
        options.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, loggedInSessionCookie);
    }

    protected String getExecutionPlanFromFile(String testCaseFolderName, String executionPlanFileName)
            throws Exception {
        String relativeFilePath = getFilePath(testCaseFolderName,executionPlanFileName);
        //String relativeFilePath = getTestArtifactLocation() + CEPIntegrationTestConstants.RELATIVE_PATH_TO_TEST_ARTIFACTS + testCaseFolderName + "/" + executionPlanFileName;
        //relativeFilePath = relativeFilePath.replaceAll("[\\\\/]", Matcher.quoteReplacement(File.separator));
        return siddhiSimulatorUtil.readFile(relativeFilePath);
    }

    protected void addExecutionPlan(String executionPlan)
            throws RemoteException, InterruptedException {
        boolean isExecutionPlanAdded = false;
        eventProcessorAdminServiceClient.addExecutionPlan(executionPlan);
    }

    protected int getExecutionPlanCount() throws RemoteException {
        return eventProcessorAdminServiceClient.getExecutionPlanConfigurationCount();
    }
    
    protected int getActiveExecutionPlanCount() throws RemoteException {
        return eventProcessorAdminServiceClient.getActiveExecutionPlanConfigurationCount();
    }

    protected void deleteExecutionPlan(String planName) throws RemoteException {
        eventProcessorAdminServiceClient.removeActiveExecutionPlan(planName);
    }

    protected String getActiveExecutionPlan(String planName) throws RemoteException {
        return eventProcessorAdminServiceClient.getActiveExecutionPlan(planName);
    }

    protected void editActiveExecutionPlan(String executionPlan, String executionPlanName) throws RemoteException {
        eventProcessorAdminServiceClient.editActiveExecutionPlan(executionPlan, executionPlanName);
    }

    private void initEventPublisherAdminServiceClient(
            String backendURL,
            String loggedInSessionCookie)
            throws AxisFault {
        eventPublisherAdminServiceClient = new EventPublisherAdminServiceClient(backendURL, loggedInSessionCookie);
        ServiceClient client = eventPublisherAdminServiceClient._getServiceClient();
        Options options = client.getOptions();
        options.setManageSession(true);
        options.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, loggedInSessionCookie);
    }

    private void initTemplateManagerAdminServiceClient(
            String backendURL,
            String loggedInSessionCookie)
            throws AxisFault {
        templateManagerAdminServiceClient = new TemplateManagerAdminServiceClient(backendURL, loggedInSessionCookie);
        ServiceClient client = templateManagerAdminServiceClient._getServiceClient();
        Options options = client.getOptions();
        options.setManageSession(true);
        options.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, loggedInSessionCookie);
    }

    protected EventSimulatorAdminServiceClient getEventSimulatorAdminServiceClient(
            String backendURL,
            String loggedInSessionCookie) throws AxisFault {
        initEventSimulatorAdminServiceClient(backendURL, loggedInSessionCookie);
        return eventSimulatorAdminServiceClient;
    }

    private void initEventSimulatorAdminServiceClient(
            String backendURL,
            String loggedInSessionCookie)
            throws AxisFault {
        eventSimulatorAdminServiceClient = new EventSimulatorAdminServiceClient(backendURL, loggedInSessionCookie);
        ServiceClient client = eventSimulatorAdminServiceClient._getServiceClient();
        Options options = client.getOptions();
        options.setManageSession(true);
        options.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING, loggedInSessionCookie);
    }

    private void initializeStub() throws Exception {
        ConfigurationContext configContext = ConfigurationContextFactory.
                createConfigurationContextFromFileSystem(null);
        String loggedInSessionCookie = getSessionCookie();
        analyticsStub = new AnalyticsProcessorAdminServiceStub(configContext,
                backendURL + ANALYTICS_SERVICE_NAME);
        ServiceClient client = analyticsStub._getServiceClient();
        Options option = client.getOptions();
        option.setTimeOutInMilliSeconds(300000);
        option.setManageSession(true);
        option.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING,
                loggedInSessionCookie);
    }

    /**
     * Know if record exists or not.
     *
     * @param tenantId  Tenant ID of the table.
     * @param tableName name of the Table.
     * @param max_tries no of attempts to get record count.
     * @return true if record exists in the given table.
     * @throws InterruptedException
     * @throws AnalyticsException
     */
    protected boolean isRecordExists(int tenantId, String tableName, int max_tries) throws InterruptedException, AnalyticsException {
        int i = 0;
        while (i < max_tries) {
            if (getRecordCount(tenantId, tableName) >= 1) {
                return true;
            }
            i++;
            Thread.sleep(10000);
        }
        return false;
    }
}
