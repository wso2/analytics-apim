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
package org.wso2.carbon.analytics.apim.spark.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.wso2.carbon.analytics.apim.spark.udf.APIManagerAnalyticsUDF;
import org.wso2.carbon.analytics.spark.core.udf.CarbonUDF;

/**
 * This class represents the API Manager Spark Service Component.
 *
 * @scr.component name="org.wso2.carbon.analytics.apim.spark" immediate="true"
 */

public class APIManagerSparkComponent {
    private static final Log log = LogFactory.getLog(APIManagerSparkComponent.class);

    protected void activate(ComponentContext ctx) {
        if (log.isDebugEnabled()) {
            log.debug("Starting APIManagerSparkComponent#activate");
        }
        BundleContext bundleContext = ctx.getBundleContext();
        try {
            bundleContext.registerService(CarbonUDF.class, new APIManagerAnalyticsUDF(), null);
        } catch (Throwable e) {
            log.error("Error in activating APIManagerSparkComponent: " + e.getMessage(), e);
        }
    }
}
