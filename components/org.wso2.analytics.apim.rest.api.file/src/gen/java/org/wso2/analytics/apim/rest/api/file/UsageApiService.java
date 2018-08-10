package org.wso2.analytics.apim.rest.api.file;

import org.wso2.analytics.apim.rest.api.file.*;
import org.wso2.analytics.apim.rest.api.file.dto.*;

import org.wso2.msf4j.formparam.FormDataParam;
import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.Request;

import org.wso2.analytics.apim.rest.api.file.dto.ErrorDTO;
import java.io.File;

import java.util.List;
import org.wso2.analytics.apim.rest.api.file.NotFoundException;

import java.io.InputStream;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;

public abstract class UsageApiService {
    public abstract Response usageUploadFilePost(InputStream analyticsInputStream, FileInfo analyticsDetail
  ,Request request) throws NotFoundException;
}
