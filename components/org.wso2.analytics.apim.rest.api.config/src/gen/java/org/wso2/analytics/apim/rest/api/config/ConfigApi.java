package org.wso2.analytics.apim.rest.api.config;


import io.swagger.annotations.ApiParam;

import org.wso2.analytics.apim.rest.api.config.dto.ErrorDTO;
import org.wso2.analytics.apim.rest.api.config.factories.ConfigApiServiceFactory;

import org.wso2.msf4j.Microservice;
import org.wso2.msf4j.Request;
import org.wso2.msf4j.formparam.FileInfo;
import org.wso2.msf4j.formparam.FormDataParam;
import org.osgi.service.component.annotations.Component;

import java.io.InputStream;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.HEAD;

import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

@Component(
    name = "org.wso2.analytics.apim.rest.api.config.ConfigApi",
    service = Microservice.class,
    immediate = true
)
@Path("/analytics/v1.[\\d]+/config")
@Consumes({ "application/json" })
@Produces({ "application/json" })
@ApplicationPath("/config")
@io.swagger.annotations.Api(description = "the config API")
public class ConfigApi implements Microservice  {
   private final ConfigApiService delegate = ConfigApiServiceFactory.getConfigApi();

    
    @GET
    @Path("/getServerURL")
    @Consumes({ "application/json" })
    @Produces({ "application/json" })
    @io.swagger.annotations.ApiOperation(value = "Retrieve the Server url ", notes = "Retrieve the Server url from the dashboard deployment.yaml ", response = void.class, tags={  })
    @io.swagger.annotations.ApiResponses(value = { 
        @io.swagger.annotations.ApiResponse(code = 200, message = "Ok. REST API url successfully retrieved. ", response = void.class),
        
        @io.swagger.annotations.ApiResponse(code = 400, message = "Bad Request. Invalid request or validation error. ", response = void.class) })
    public Response configGetServerURLGet( @Context Request request)
    throws NotFoundException {
        
        return delegate.configGetServerURLGet(request);
    }
}
