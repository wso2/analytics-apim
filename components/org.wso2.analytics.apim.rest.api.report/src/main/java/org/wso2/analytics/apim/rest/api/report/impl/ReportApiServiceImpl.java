package org.wso2.analytics.apim.rest.api.report.impl;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.pdfbox.exceptions.COSVisitorException;
import org.wso2.analytics.apim.idp.client.ApimIdPClient;
import org.wso2.analytics.apim.rest.api.report.NotFoundException;
import org.wso2.analytics.apim.rest.api.report.ReportApiService;
import org.wso2.analytics.apim.rest.api.report.api.ReportGenerator;
import org.wso2.analytics.apim.rest.api.report.internal.ServiceHolder;
import org.wso2.analytics.apim.rest.api.report.reportgen.DefaultReportGeneratorImpl;
import org.wso2.carbon.analytics.idp.client.core.exception.AuthenticationException;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.external.dto.OAuth2IntrospectionResponse;
import org.wso2.msf4j.Request;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;

/**
 * Service implementation class to fetch PDF report.
 */
public class ReportApiServiceImpl extends ReportApiService {

    private static final Log log = LogFactory.getLog(ReportApiServiceImpl.class);
    private static final String ADMIN_SCOPE = "apim_analytics:admin";
    /**
     *
     * @param month month in number format. e.g 01, 02
     * @param year year in  number format. e.g 2019, 2020
     * @param request
     * @return PDF report for request summary
     * @throws NotFoundException
     */
    @Override
    public Response reportGet(String month, String year, Request request) throws NotFoundException {

        HttpHeaders httpHeaders = request.getHeaders();

        List<String> authorization = httpHeaders.getRequestHeader("Authorization");
        //If no authorization information present; block access
        if (authorization == null || authorization.isEmpty()) {
            String errorMsg = "Received a request to PDF Reporting REST API without Authorization header.";
            log.error(errorMsg);
            return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
        }
        ApimIdPClient idPClient = (ApimIdPClient) ServiceHolder.getInstance().getApimAdminClient();
        boolean isAdmin;
        OAuth2IntrospectionResponse introspectionResponse;
        try {
            introspectionResponse = idPClient.getIntrospectResponse
                    (extractTokenFromAuthHeader(authorization));
            isAdmin = introspectionResponse.getScope().contains(ADMIN_SCOPE);
        } catch (IdPClientException | AuthenticationException e) {
            String errorMsg = "Error during token introspection for report generation API.";
            log.error(errorMsg, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMsg).build();
        }
        if (isAdmin) {
            if (StringUtils.isEmpty(month) || StringUtils.isEmpty(year)) {
                String errorMsg = "Missing required parameters.";
                log.error(errorMsg);
                return Response.status(Response.Status.BAD_REQUEST).entity(errorMsg).build();
            }
            InputStream data;
            try {
                String username = introspectionResponse.getUsername();
                String tenantDomain = idPClient.extractTenantDomainFromUserName(username);
                ReportGenerator defaultReportGeneratorImpl = new DefaultReportGeneratorImpl(year, month, tenantDomain);
                data = defaultReportGeneratorImpl.generateMonthlyRequestSummaryPDF();
                if (data != null) {
                    return Response.ok().entity(data).build();
                } else {
                    String msg = "No data found for required time period";
                    return Response.ok().entity(msg).build();
                }

            } catch (COSVisitorException | IOException | IdPClientException e) {
                String errorMsg = "Unable to fetch report.";
                log.error(errorMsg, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMsg).build();
            }
        } else {
            String errorMsg = "Access token does not contain admin scope. Hence unable to fetch report for user :" +
                    introspectionResponse.getUsername();
            log.error(errorMsg);
            return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
        }
    }

    private String extractTokenFromAuthHeader(List<String> authHeader) {

        String encodedCredentials = authHeader.get(0).replaceFirst("Bearer" + " ", "");
        return encodedCredentials;
    }

}
