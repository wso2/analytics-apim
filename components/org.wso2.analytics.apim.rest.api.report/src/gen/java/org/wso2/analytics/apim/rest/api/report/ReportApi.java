package org.wso2.analytics.apim.rest.api.report;


import io.swagger.annotations.ApiParam;

import org.wso2.analytics.apim.rest.api.report.dto.ErrorDTO;
import org.wso2.analytics.apim.rest.api.report.factories.ReportApiServiceFactory;

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
    name = "org.wso2.analytics.apim.rest.api.report.ReportApi",
    service = Microservice.class,
    immediate = true
)
@Path("/analytics-apim/apis/v1.[\\d]+/report")


@ApplicationPath("/report")
@io.swagger.annotations.Api(description = "the report API")
public class ReportApi implements Microservice  {
   private final ReportApiService delegate = ReportApiServiceFactory.getReportApi();

    
    @GET
    
    
    
    @io.swagger.annotations.ApiOperation(value = "Retrieve PDF Report ", notes = "Downloads a PDF report with API traffic data for a given month ", response = void.class, tags={  })
    @io.swagger.annotations.ApiResponses(value = { 
        @io.swagger.annotations.ApiResponse(code = 200, message = "", response = void.class),
        
        @io.swagger.annotations.ApiResponse(code = 400, message = "Bad Request. Invalid request or validation error. ", response = void.class) })
    public Response reportGet(@ApiParam(value = "The month of the required report.") @QueryParam("month") String month
,@ApiParam(value = "The year of the required report.") @QueryParam("year") String year
 ,@Context Request request)
    throws NotFoundException {
        
        return delegate.reportGet(month,year,request);
    }
}
