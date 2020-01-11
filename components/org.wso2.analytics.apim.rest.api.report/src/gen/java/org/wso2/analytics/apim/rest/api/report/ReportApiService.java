package org.wso2.analytics.apim.rest.api.report;

import org.wso2.analytics.apim.rest.api.report.*;
import org.wso2.analytics.apim.rest.api.report.dto.*;

import org.wso2.msf4j.formparam.FormDataParam;
import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.Request;

import org.wso2.analytics.apim.rest.api.report.dto.ErrorDTO;

import java.util.List;
import org.wso2.analytics.apim.rest.api.report.NotFoundException;

import java.io.InputStream;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;

public abstract class ReportApiService {
    public abstract Response reportGet(String month
 ,String year
  ,Request request) throws NotFoundException;
}
