/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.idp.client;

import org.apache.axis2.AxisFault;
import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import org.wso2.carbon.identity.oauth.stub.OAuthAdminServiceIdentityOAuthAdminException;
import org.wso2.carbon.identity.oauth.stub.OAuthAdminServiceStub;
import org.wso2.carbon.identity.oauth.stub.dto.OAuthConsumerAppDTO;

import java.rmi.RemoteException;

import static org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.OAUTH_ADMIN_SERVICE_ENDPOINT_POSTFIX;

/**
 * Client for the OAuth Admin Service.
 */
public class OAuthAdminServiceClient {
  private OAuthAdminServiceStub oAuthAdminServiceStub;

  public OAuthAdminServiceClient(String adminServiceBaseUrl, String sessionCookie) throws AxisFault {
    String endPoint = adminServiceBaseUrl + OAUTH_ADMIN_SERVICE_ENDPOINT_POSTFIX;
    oAuthAdminServiceStub = new OAuthAdminServiceStub(endPoint);

    ServiceClient serviceClient = oAuthAdminServiceStub._getServiceClient();
    Options option = serviceClient.getOptions();
    option.setManageSession(true); 
    option.setProperty(COOKIE_STRING, sessionCookie);
  } 
   
  public OAuthConsumerAppDTO[] getAllOAuthApplicationData() throws RemoteException,
          OAuthAdminServiceIdentityOAuthAdminException {
    return oAuthAdminServiceStub.getAllOAuthApplicationData();
  }

  public OAuthConsumerAppDTO getOAuthApplicationDataByAppName(String oAuthAppName) throws RemoteException,
          OAuthAdminServiceIdentityOAuthAdminException {
    return oAuthAdminServiceStub.getOAuthApplicationDataByAppName(oAuthAppName);
  }
}
