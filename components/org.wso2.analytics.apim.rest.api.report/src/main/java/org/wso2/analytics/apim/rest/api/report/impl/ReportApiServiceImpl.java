/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.rest.api.report.impl;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.pdfbox.exceptions.COSVisitorException;
import org.wso2.analytics.apim.rest.api.report.NotFoundException;
import org.wso2.analytics.apim.rest.api.report.ReportApiService;
import org.wso2.analytics.apim.rest.api.report.api.ReportGenerator;
import org.wso2.analytics.apim.rest.api.report.internal.ServiceHolder;
import org.wso2.analytics.apim.rest.api.report.reportgen.DefaultReportGeneratorImpl;
import org.wso2.carbon.analytics.idp.client.core.api.IdPClient;
import org.wso2.carbon.analytics.idp.client.core.exception.AuthenticationException;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.models.Role;
import org.wso2.carbon.analytics.idp.client.core.models.User;
import org.wso2.msf4j.Request;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.core.Response;

import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.AT;

/**
 * Service implementation class to fetch PDF report.
 */
public class ReportApiServiceImpl extends ReportApiService {

    private static final Log log = LogFactory.getLog(ReportApiServiceImpl.class);
    private static final String ADMIN_SCOPE = "apim_analytics:admin_any";
    private static final String DASHBOARD_USER = "DASHBOARD_USER=";
    private static final String AM_COOKIE_P1 = "SDID";
    private static final String AM_COOKIE_P2 = "HID=";
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

        String cookie = getAccessToken(request.getHeader("Cookie"));
        //If no authorization information present; block access
        if (StringUtils.isEmpty(cookie)) {
            String errorMsg = "Received a request to PDF Reporting REST API without Cookie header.";
            log.error(errorMsg);
            return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
        }
        IdPClient idPClient = ServiceHolder.getInstance().getApimAdminClient();
        boolean isAdmin = false;
        String username;
        try {
            username = idPClient.authenticate(cookie);
            User user = idPClient.getUser(username);
            List<Role> rolesOfUser = user.getRoles();
            for (Role role : rolesOfUser) {
                if (role.getDisplayName().equals(ADMIN_SCOPE)) {
                    isAdmin = true;
                }
            }
        } catch (IdPClientException | AuthenticationException e) {
            String errorMsg = "Error during authentication for report generation API.";
            log.error(errorMsg, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMsg).build();
        }
        if (isAdmin) {
            if (StringUtils.isEmpty(year) || StringUtils.isEmpty(month)) {
                String errorMsg = "Missing required parameters.";
                log.error(errorMsg);
                return Response.status(Response.Status.BAD_REQUEST).entity(errorMsg).build();
            }
            InputStream data;
            try {
                String tenantDomain = extractTenantDomainFromUserName(username);
                ReportGenerator defaultReportGeneratorImpl = new DefaultReportGeneratorImpl(year, month, tenantDomain);
                data = defaultReportGeneratorImpl.generateMonthlyRequestSummaryPDF();
                if (data != null) {
                    return Response.ok().entity(data).build();
                } else {
                    String msg = "No data found for requested time period";
                    return Response.ok().entity(msg).build();
                }

            } catch (COSVisitorException | IOException | IdPClientException e) {
                String errorMsg = "Unable to fetch report.";
                log.error(errorMsg, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMsg).build();
            }
        } else {
            String errorMsg = "Access token does not contain admin scope. Hence unable to fetch report for user :" +
                    username;
            log.error(errorMsg);
            return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
        }
    }

    /**
     * Construct the access token from cookies.
     *
     * @param cookies cookies string received with the request
     * @return the access token
     */
    private String getAccessToken(String cookies) {
        List<String> cookieList = Arrays.asList(cookies.split(";"));
        String accessTokenP1 = "";
        String accessTokenP2 = "";

        for (String cookie : cookieList) {
            if (cookie.contains(DASHBOARD_USER)) {
                String userDTO = cookie.replace(DASHBOARD_USER, "");
                JsonObject jsonUserDto = new Gson().fromJson(userDTO, JsonObject.class);
                JsonElement element = jsonUserDto.get(AM_COOKIE_P1);
                if (element != null) {
                    accessTokenP1 = element.getAsString();
                }
            } else if (cookie.contains(AM_COOKIE_P2)) {
                accessTokenP2 = cookie.replace(AM_COOKIE_P2, "").trim();
            }
        }

        return accessTokenP1 + accessTokenP2;
    }

    private String extractTenantDomainFromUserName(String username) throws IdPClientException {
        if (username == null || username.isEmpty()) {
            String error = "Username cannot be empty.";
            log.error(error);
            throw new IdPClientException(error);
        }
        String[] usernameSections = username.split(AT);
        String tenantDomain = usernameSections[usernameSections.length - 1];
        if (tenantDomain == null) {
            String error = "Cannot get the tenant domain from the given username: " + username;
            log.error(error);
            throw new IdPClientException(error);
        }
        return tenantDomain;
    }

}
