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
package org.wso2.analytics.apim.integration.tests.apim.extension;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.automation.engine.annotations.ExecutionEnvironment;
import org.wso2.carbon.automation.engine.context.AutomationContext;
import org.wso2.carbon.automation.engine.context.TestUserMode;
import org.wso2.carbon.automation.engine.exceptions.AutomationFrameworkException;
import org.wso2.carbon.automation.engine.extensions.ExecutionListenerExtension;
import org.wso2.carbon.automation.extensions.servers.carbonserver.TestServerManager;

import javax.xml.xpath.XPathExpressionException;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * This Extension class will start the carbon server by replacing the rdbms capp with the rest capp
 */

public class CappSwapper extends ExecutionListenerExtension {
    private static final Log log = LogFactory.getLog(CappSwapper.class);
    private static TestServerManager serverManager;
    private String executionEnvironment;

    @Override
    public void initiate() throws AutomationFrameworkException {

        AutomationContext context;
        try {
            context = new AutomationContext("DAS", TestUserMode.SUPER_TENANT_ADMIN);
        } catch (XPathExpressionException e) {
            throw new AutomationFrameworkException("Error Initiating Server Information", e);
        }

        if (this.getParameters().get("-DportOffset") == null) {
            this.getParameters().put("-DportOffset", "0");
        }

        serverManager = new TestServerManager(context, null, getParameters()) {
            public void configureServer() throws AutomationFrameworkException {

                String carbonappsPath =
                        carbonHome + File.separator + "repository" + File.separator + "deployment" + File.separator
                                + "server" + File.separator + "carbonapps" + File.separator;
                String RdbmsCappPath = carbonappsPath + CappTestConstants.RDBMS_CAPP;
                String RestCappPath =
                        carbonHome + File.separator + "statistics" + File.separator + CappTestConstants.REST_CAPP;
                Path rdbms = Paths.get(RdbmsCappPath);
                Path rest = Paths.get(RestCappPath);
                Path carbonapps = Paths.get(carbonappsPath + CappTestConstants.REST_CAPP);

                try {
                    Files.delete(rdbms);
                    Files.copy(rest, carbonapps, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        };
        try {
            this.executionEnvironment = this.getAutomationContext()
                    .getConfigurationValue("//executionEnvironment/text()");
        } catch (XPathExpressionException var2) {
            handleException("Error while initiating test environment", var2);
        }

    }

    @Override
    public void onExecutionStart() throws AutomationFrameworkException {
        try {
            if (this.executionEnvironment.equalsIgnoreCase(ExecutionEnvironment.STANDALONE.name())) {
                String e = this.serverManager.startServer();
                System.setProperty("carbon.home", e);
            }
        } catch (Exception var2) {
            handleException("Fail to stop carbon server ", var2);
        }
    }

    @Override
    public void onExecutionFinish() throws AutomationFrameworkException {
        try {
            if (this.executionEnvironment.equalsIgnoreCase(ExecutionEnvironment.STANDALONE.name())) {
                this.serverManager.stopServer();
            }
        } catch (Exception var2) {
            handleException("Fail to stop carbon server ", var2);
        }
    }

    private static void handleException(String msg, Exception e) {
        log.error(msg, e);
        throw new RuntimeException(msg, e);
    }

 }