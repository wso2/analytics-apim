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
package org.wso2.analytics.apim.rest.api.file.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.rest.api.file.NotFoundException;
import org.wso2.analytics.apim.rest.api.file.UsageApiService;
import org.wso2.analytics.apim.rest.api.file.internal.ServiceHolder;
import org.wso2.analytics.apim.rest.api.file.util.UploadServiceConstants;
import org.wso2.carbon.analytics.idp.client.core.api.IdPClient;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.models.Role;
import org.wso2.extension.siddhi.io.mgwfile.dao.MGWFileSourceDAO;
import org.wso2.extension.siddhi.io.mgwfile.dto.MGWFileInfoDTO;
import org.wso2.extension.siddhi.io.mgwfile.exception.MGWFileSourceException;
import org.wso2.msf4j.Request;
import org.wso2.msf4j.formparam.FileInfo;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Base64;
import java.util.List;
import java.util.StringTokenizer;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;

/**
 *  Service Implementation class for microgateway analytics zip upload
 */
public class UsageApiServiceImpl extends UsageApiService {
    private static final Logger log = LoggerFactory.getLogger(UsageApiServiceImpl.class);

    @Override
    public Response usageUploadFilePost(InputStream analyticsInputStream, FileInfo analyticsDetail,
            Request request) throws NotFoundException {
        HttpHeaders httpHeaders = request.getHeaders();
        String uploadedFileName = httpHeaders.getHeaderString(UploadServiceConstants.FILE_NAME_HEADER);

        try {
            List<String> authorization = httpHeaders.getRequestHeader("Authorization");
            //If no authorization information present; block access
            if (authorization == null || authorization.isEmpty()) {
                String errorMsg = "Received a request to micro gateway REST API without Authorization header";
                log.error(errorMsg);
                return Response.status(Response.Status.UNAUTHORIZED).entity(errorMsg).build();
            }
            String userName = extractUsernameFromAuthHeader(authorization);
            boolean isAdmin = isUserAdmin(userName);
            if (!isAdmin) {
                String errorMessage = "Authenticated user does not have admin role.\n";
                log.error(errorMessage);
                return Response.status(Response.Status.BAD_REQUEST).entity(errorMessage).build();
            }
            if (uploadedFileName == null || uploadedFileName.isEmpty()) {
                String errorMessage = "FileName Header is missing.\n";
                log.error(errorMessage);
                return Response.status(Response.Status.BAD_REQUEST).entity(errorMessage).build();
            }
            if (!uploadedFileName.matches(UploadServiceConstants.FILE_NAME_REGEX)) {
                return Response.status(Response.Status.BAD_REQUEST).entity("FileName Header is in incorrect format.\n")
                        .build();
            }

            //Add the uploaded file into the database
            long timeStamp = Long.parseLong(uploadedFileName.split("\\.")[2]);
            MGWFileInfoDTO dto = new MGWFileInfoDTO(uploadedFileName, timeStamp);
            MGWFileSourceDAO.persistUploadedFile(dto, analyticsInputStream);
            log.info("Successfully uploaded the API Usage file [" + uploadedFileName + "]");
            return Response.status(Response.Status.CREATED).entity("File uploaded successfully.\n").build();

        } catch (MGWFileSourceException e) {
            String msg = "Error occurred while uploading API Usage file : " + uploadedFileName;
            log.error(msg, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(msg).build();
        }
    }

    /**
     * This method will return a boolean on whether the user has admin role or not
     * @param userName username of the user who invoked the API
     * @return
     */
    private boolean isUserAdmin(String userName) {
        IdPClient idPClient = ServiceHolder.getInstance().getIdPClient();
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
     * Extracts the username given the authorization token
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

}
