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
package org.wso2.analytics.apim.integration.tests.apim.cappdeployer;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.analytics.apim.integration.tests.apim.analytics.APIMAnalyticsBaseTestCase;
import org.wso2.analytics.apim.integration.tests.apim.analytics.utils.APIMAnalyticsIntegrationTestConstants;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.integration.common.admin.client.ApplicationAdminClient;
import org.wso2.carbon.integration.common.admin.client.CarbonAppUploaderClient;
import javax.activation.DataHandler;
import java.io.File;
import java.net.URL;

public class RestCappDeployerTestCase extends APIMAnalyticsBaseTestCase {

    private static final Log log = LogFactory.getLog(RestCappDeployerTestCase.class);

    @BeforeClass
    private void initialize() throws Exception {
  super.init();
    }


    @Test
    public void deleteRDBMSCApp() throws Exception {
        ApplicationAdminClient appAdminClient = new ApplicationAdminClient(dasServer.getContextUrls().getBackEndUrl(),
                getSessionCookie());
        appAdminClient.deleteApplication("org.wso2.carbon.analytics.apim_1.0.0");
        boolean isCappDeleted = isAlertReceived(0, "Successfully Undeployed Carbon Application", 5 ,5000);
        Assert.assertTrue(isCappDeleted, "RDBMS Capp undeployment was unsuccessful");
        Thread.sleep(5000);

    }

    @Test(dependsOnMethods = "deleteRDBMSCApp")
    public void deployRestCApp() throws Exception {
        CarbonAppUploaderClient carbonAppClient = new CarbonAppUploaderClient(
                dasServer.getContextUrls().getBackEndUrl(), getSessionCookie());

        URL url = new URL("file://" + FrameworkPathUtil.getCarbonHome() + File.separator
                + APIMAnalyticsIntegrationTestConstants.REST_CAPP_PATH + File.separator +
                "org_wso2_carbon_analytics_apim_REST-1.0.0.car");

        DataHandler dh = new DataHandler(url);

        carbonAppClient.uploadCarbonAppArtifact("org_wso2_carbon_analytics_apim_REST-1.0.0.car", dh);
        boolean isCappUploaded = isAlertReceived(0, "Successfully Deployed Carbon Application", 5 ,5000);
        Assert.assertTrue(isCappUploaded, "REST Capp deployment was unsuccessful");
        Thread.sleep(5000); // activation time for execution plans & spark scripts
    }
}
