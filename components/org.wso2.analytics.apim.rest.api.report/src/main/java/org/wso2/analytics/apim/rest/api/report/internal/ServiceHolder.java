/*
* Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.rest.api.report.internal;

import org.wso2.analytics.apim.idp.client.ApimIdPClient;
import org.wso2.carbon.streaming.integrator.common.SiddhiAppRuntimeService;

/**
 *  Service Holder class for this component.
 */
public class ServiceHolder {

    private SiddhiAppRuntimeService siddhiAppRuntimeService;
    private ApimIdPClient apimAdminClient;

    private static ServiceHolder instance = new ServiceHolder();

    private ServiceHolder() {
    }

    public void setAPIMAdminClient(ApimIdPClient service) {
        this.apimAdminClient = service;
    }

    public ApimIdPClient getApimAdminClient() {
        return apimAdminClient;
    }

    public SiddhiAppRuntimeService getSiddhiAppRuntimeService() {
        return siddhiAppRuntimeService;
    }

    public void setSiddhiAppRuntimeService(SiddhiAppRuntimeService siddhiAppRuntimeService) {
        this.siddhiAppRuntimeService = siddhiAppRuntimeService;
    }

    public static ServiceHolder getInstance() {
        return instance;
    }

}
