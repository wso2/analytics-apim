package org.wso2.carbon.analytics.apim.spark.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.wso2.carbon.analytics.apim.spark.udf.APIAnalytics;
import org.wso2.carbon.analytics.spark.core.udf.CarbonUDF;

/**
 * This class represents the analytics data service web service declarative services component.
 *
 * @scr.component name="org.wso2.carbon.analytics.apim.spark" immediate="true"
 */

public class AnalyticsAPIMComponent {
    private static final Log log = LogFactory.getLog(AnalyticsAPIMComponent.class);

    protected void activate(ComponentContext ctx) {
        if (log.isDebugEnabled()) {
            log.debug("Starting AnalyticsDataServiceComponent#activate");
        }
        BundleContext bundleContext = ctx.getBundleContext();
        try {
            bundleContext.registerService(CarbonUDF.class, new APIAnalytics(), null);
        } catch (Throwable e) {
            log.error("Error in activating analytics data service: " + e.getMessage(), e);
        }
    }
}
