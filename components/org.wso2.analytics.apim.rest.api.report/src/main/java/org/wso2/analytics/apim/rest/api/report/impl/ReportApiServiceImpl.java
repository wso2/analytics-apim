package org.wso2.analytics.apim.rest.api.report.impl;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.pdfbox.exceptions.COSVisitorException;
import org.wso2.analytics.apim.rest.api.report.ApiException;
import org.wso2.analytics.apim.rest.api.report.NotFoundException;
import org.wso2.analytics.apim.rest.api.report.ReportApiService;
import org.wso2.analytics.apim.rest.api.report.api.ReportGenerator;
import org.wso2.analytics.apim.rest.api.report.internal.ServiceHolder;
import org.wso2.analytics.apim.rest.api.report.reportgen.DefaultReportGeneratorImpl;
import org.wso2.carbon.analytics.idp.client.core.api.IdPClient;
import org.wso2.carbon.analytics.idp.client.core.exception.AuthenticationException;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.models.Role;
import org.wso2.msf4j.Request;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Base64;
import java.util.List;
import java.util.StringTokenizer;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;

/**
 * Service implementation class to fetch PDF report
 */
public class ReportApiServiceImpl extends ReportApiService {

    private static final Log log = LogFactory.getLog(ReportApiServiceImpl.class);

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
            String errorMsg = "Received a request to PD Reporting REST API without Authorization header";
            log.error(errorMsg);
            return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
        }
        IdPClient idPClient = ServiceHolder.getInstance().getApimAdminClient();
        try {
              idPClient.authenticate(extractTokenFromAuthHeader(authorization));
        } catch (AuthenticationException e) {

        } catch (IdPClientException e) {

        }
        String userName = extractUsernameFromAuthHeader(authorization);
        boolean isAdmin = isUserAdmin(userName);
        if (!isAdmin) {
            String errorMessage = "Authenticated user does not have admin role.\n";
            log.error(errorMessage);
            return Response.status(Response.Status.BAD_REQUEST).entity(errorMessage).build();
        }

        if (StringUtils.isEmpty(month) || StringUtils.isEmpty(year)) {
            String errorMsg = "Missing required parameters.";
            log.error(errorMsg);
            return Response.status(Response.Status.BAD_REQUEST).entity(errorMsg).build();
        }
        InputStream data;
        try {
            String tenantDomain = "carbon.super";
            ReportGenerator defaultReportGeneratorImpl = new DefaultReportGeneratorImpl(year, month, tenantDomain);
            data = defaultReportGeneratorImpl.generateMonthlyRequestSummaryPDF();
            if (data != null) {
                return Response.ok().entity(data).build();
            } else {
                String msg = "No data found for required time period";
                return Response.ok().entity(msg).build();
            }

        } catch (ApiException | COSVisitorException | IOException e) {
            String errorMsg = "Unable to fetch report.";
            log.error(errorMsg , e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMsg).build();
        }
    }

    /**
     * This method will return a boolean on whether the user has admin role or not.
     * @param userName username of the user who invoked the API
     * @return
     */
    private boolean isUserAdmin(String userName) {
        IdPClient idPClient = ServiceHolder.getInstance().getApimAdminClient();
        try {
            String adminRole = idPClient.getAdminRole().getDisplayName();
            List<Role> userRoles = idPClient.getUserRoles(userName);
            for (Role role : userRoles) {
                if (adminRole.equals(role.getDisplayName())) {
                    return true;
                }
            }
            return false;
        } catch (IdPClientException e) {
            String msg = "User needs admin role to perform this operation";
            log.error(msg, e);
            return false;
        }
    }

    /**
     * Extracts the username given the authorization token.
     * @param authHeader auth token with the "Basic" prefix
     * @return
     */
    private String extractUsernameFromAuthHeader(List<String> authHeader) {
        String encodedCredentials = authHeader.get(0).replaceFirst("Basic" + " ", "");

        //Decode username and password
        String usernameAndPassword = null;
        usernameAndPassword = new String(
                Base64.getDecoder().decode(encodedCredentials.getBytes(Charset.forName("UTF-8"))),
                Charset.forName("UTF-8"));
        //Split username and password tokens
        final StringTokenizer tokenizer = new StringTokenizer(usernameAndPassword, ":");
        String username = tokenizer.nextToken();
        return username;
    }

    private String extractTokenFromAuthHeader(List<String> authHeader) {

        String encodedCredentials = authHeader.get(0).replaceFirst("Basic" + " ", "");
        return encodedCredentials;
    }

}
