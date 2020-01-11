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

import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.wso2.analytics.apim.idp.client.ApimIdPClient;
import org.wso2.carbon.analytics.idp.client.external.ExternalIdPClient;
import org.wso2.carbon.streaming.integrator.common.SiddhiAppRuntimeService;

/**
 * Service component to get Carbon Config Provider OSGi service.
 */
@Component(
        name = "ApimReportServiceComponent",
        service = ServiceComponent.class,
        immediate = true
)
public class ServiceComponent {
    @Activate
    protected void start(BundleContext bundleContext) {

    }

    @Deactivate
    protected void stop() {
    }

    @Reference(
            name = "siddhi.app.runtime.service.reference",
            service = SiddhiAppRuntimeService.class,
            cardinality = ReferenceCardinality.AT_LEAST_ONE,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unsetSiddhiAppRuntimeService"
    )
    protected void setSiddhiAppRuntimeService(SiddhiAppRuntimeService siddhiAppRuntimeService) {
        ServiceHolder.getInstance().setSiddhiAppRuntimeService(siddhiAppRuntimeService);
    }

    protected void unsetSiddhiAppRuntimeService(SiddhiAppRuntimeService siddhiAppRuntimeService) {
        ServiceHolder.getInstance().setSiddhiAppRuntimeService(null);
    }

    @Reference(
            name = "APIMAdminClient",
            service = ApimIdPClient.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterIdP"
    )
    protected void registerIdP(ApimIdPClient client) {
        ServiceHolder.getInstance().setAPIMAdminClient(client);
    }

    protected void unregisterIdP(ExternalIdPClient client) {

        ServiceHolder.getInstance().setAPIMAdminClient(null);
    }
}
