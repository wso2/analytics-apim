package org.wso2.analytics.apim.rest.api.file;

import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.Request;

import java.io.InputStream;

import javax.ws.rs.core.Response;

public abstract class UsageApiService {
    public abstract Response usageUploadFilePost(InputStream analyticsInputStream, FileInfo analyticsDetail
  ,Request request) throws NotFoundException;
}
