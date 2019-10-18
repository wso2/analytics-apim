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
package org.wso2.analytics.apim.rest.api.proxy.exceptions;

import org.wso2.analytics.apim.rest.api.proxy.dto.ErrorDTO;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

/**
 * Bad request exception
 */
public class BadRequestException extends WebApplicationException {
    private static final String APPLICATION_JSON = "application/json";
    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private String message;

    public BadRequestException(ErrorDTO errorDTO) {
        super(Response.status(Response.Status.BAD_REQUEST)
                .entity(errorDTO)
                .header(HEADER_CONTENT_TYPE, APPLICATION_JSON)
                .build());
        message = errorDTO.getDescription();
    }

    public BadRequestException() {
        super(Response.Status.BAD_REQUEST);
    }

    @Override
    public String getMessage() {
        return message;
    }
}

