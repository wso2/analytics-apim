package org.wso2.analytics.apim.rest.api.file;

import org.osgi.service.component.annotations.Component;
import org.wso2.analytics.apim.rest.api.file.factories.UsageApiServiceFactory;
import org.wso2.carbon.analytics.msf4j.interceptor.common.AuthenticationInterceptor;
import org.wso2.msf4j.Microservice;
import org.wso2.msf4j.Request;
import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.formparam.FormDataParam;
import org.wso2.msf4j.interceptor.annotation.RequestInterceptor;

import java.io.InputStream;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

@Component(
    name = "org.wso2.analytics.apim.rest.api.file.UsageApi",
    service = Microservice.class,
    immediate = true
)
@Path("/analytics/v1.[\\d]+/usage")
@Produces({ "application/json" })
@ApplicationPath("/usage")
@io.swagger.annotations.Api(description = "the usage API")
@RequestInterceptor(AuthenticationInterceptor.class)
public class UsageApi implements Microservice  {
   private final UsageApiService delegate = UsageApiServiceFactory.getUsageApi();

    
    @POST
    @Path("/upload-file/")
    @Consumes({ "multipart/form-data" })
    @Produces({ "application/json" })
    @io.swagger.annotations.ApiOperation(value = "Uploading File ", notes = "Reveives analytics data as a zip archive and upload it to persist in data base. ", response = void.class, authorizations = {
        @io.swagger.annotations.Authorization(value = "OAuth2Security", scopes = {
            
        })
    }, tags={  })
    @io.swagger.annotations.ApiResponses(value = { 
        @io.swagger.annotations.ApiResponse(code = 201, message = "Created. File uploaded successfully. ", response = void.class),
        
        @io.swagger.annotations.ApiResponse(code = 400, message = "Bad Request. Invalid request or validation error. ", response = void.class),
        
        @io.swagger.annotations.ApiResponse(code = 415, message = "Unsupported Media Type. The entity of the request was in a not supported format. ", response = void.class) })
    public Response usageUploadFilePost(
            @FormDataParam("file") InputStream analyticsInputStream,
            @FormDataParam("file") FileInfo analyticsDetail
 ,@Context Request request)
    throws NotFoundException {
        
        return delegate.usageUploadFilePost(analyticsInputStream, analyticsDetail,request);
    }
}
