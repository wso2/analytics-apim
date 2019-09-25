/*
* Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.rest.api.config.internal;

import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.*;
import org.wso2.carbon.config.provider.ConfigProvider;

/**
 * Service component to get Carbon Config Provider OSGi service.
 */
@Component(
        name = "ServiceComponentConfigProvider",
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

    @Reference(service = ConfigProvider.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unregisterConfigProvider")
    protected void registerConfigProvider(ConfigProvider client) {
        ServiceHolder.getInstance().setConfigProvider(client);
    }

    protected void unregisterConfigProvider(ConfigProvider client) {
        ServiceHolder.getInstance().setConfigProvider(null);
    }
}
