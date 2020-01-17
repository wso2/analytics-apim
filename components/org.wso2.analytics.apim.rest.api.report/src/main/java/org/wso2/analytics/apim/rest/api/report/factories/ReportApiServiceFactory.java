package org.wso2.analytics.apim.rest.api.report.factories;

import org.wso2.analytics.apim.rest.api.report.ReportApiService;
import org.wso2.analytics.apim.rest.api.report.impl.ReportApiServiceImpl;

/**
 * Factory class for ReportApiService.
 */
public class ReportApiServiceFactory {
    private static final ReportApiService service = new ReportApiServiceImpl();

    public static ReportApiService getReportApi() {
        return service;
    }
}
