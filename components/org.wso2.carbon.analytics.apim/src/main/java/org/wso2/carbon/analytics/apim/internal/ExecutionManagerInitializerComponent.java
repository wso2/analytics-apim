/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.carbon.analytics.apim.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.service.component.ComponentContext;
import org.wso2.carbon.registry.core.service.RegistryService;

/**
 * This class represents the API Manager - Execution Manager initializer Component.
 *
 * @scr.component name="APIMAnalytics.ExecutionManagerInitializer.component" immediate="true"
 * @scr.reference name="registry.service"
 * interface="org.wso2.carbon.registry.core.service.RegistryService"
 * cardinality="1..1" policy="dynamic" bind="setRegistryService" unbind="unsetRegistryService"
 */

public class ExecutionManagerInitializerComponent {
    private static final Log log = LogFactory.getLog(ExecutionManagerInitializerComponent.class);

    protected void activate(ComponentContext ctx) {
//        ExecutionManagerInitializer executionManagerService = new ExecutionManagerInitializer();
//        ctx.getBundleContext().registerService(ExecutionManagerInitializer.class.getName(),
//                executionManagerService, null);
        if (log.isDebugEnabled()) {
            log.debug("Starting APIManagerInitilizerComponent#activate");
        }
        ExecutionManagerInitializer.addSparkConfigs();
        ExecutionManagerInitializer.addTemplateConfigs();
    }

    protected void setRegistryService(RegistryService registryService) {
        if (registryService != null && log.isDebugEnabled()) {
            log.debug("Registry service initialized");
        }
        ServiceReferenceHolder.setRegistryService(registryService);
    }

    protected void unsetRegistryService(RegistryService registryService) {
        ServiceReferenceHolder.setRegistryService(null);
    }



}
