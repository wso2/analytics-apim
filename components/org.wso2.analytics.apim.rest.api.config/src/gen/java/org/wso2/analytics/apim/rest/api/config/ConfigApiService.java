package org.wso2.analytics.apim.rest.api.config;

import org.wso2.analytics.apim.rest.api.config.*;
import org.wso2.analytics.apim.rest.api.config.dto.*;

import org.wso2.msf4j.formparam.FormDataParam;
import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.Request;

import org.wso2.analytics.apim.rest.api.config.dto.ErrorDTO;
import org.wso2.analytics.apim.rest.api.config.dto.ServerUrlListDTO;

import java.util.List;
import org.wso2.analytics.apim.rest.api.config.NotFoundException;

import java.io.InputStream;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;

public abstract class ConfigApiService {
    public abstract Response configGetServerUrlsGet( Request request) throws NotFoundException;
}
