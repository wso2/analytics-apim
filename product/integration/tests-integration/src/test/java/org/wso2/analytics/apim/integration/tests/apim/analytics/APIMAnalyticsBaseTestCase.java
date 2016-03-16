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
import org.testng.annotations.BeforeClass;
import org.wso2.analytics.apim.integration.common.clients.DataPublisherClient;
import org.wso2.analytics.apim.integration.common.clients.EventPublisherAdminServiceClient;
import org.wso2.analytics.apim.integration.common.utils.DASIntegrationTest;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.integration.common.admin.client.LogViewerClient;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;

public class APIMAnalyticsBaseTestCase extends DASIntegrationTest {
    private DataPublisherClient dataPublisherClient;
    protected EventPublisherAdminServiceClient eventPublisherAdminServiceClient;
    protected static LogViewerClient logViewerClient;

    @BeforeClass(alwaysRun = true)
    public void init() throws Exception {
        super.init();
        String session = getSessionCookie();
        eventPublisherAdminServiceClient = getEventPublisherAdminServiceClient(backendURL, session);
        logViewerClient = new LogViewerClient(backendURL, session);
    }

    protected void publishEvent(String streamName, String streamVersion, Event event) throws Exception {
        dataPublisherClient = new DataPublisherClient();
        dataPublisherClient.publish(streamName, streamVersion, event);
        Thread.sleep(1000);
        dataPublisherClient.shutdown();
    }

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
}
