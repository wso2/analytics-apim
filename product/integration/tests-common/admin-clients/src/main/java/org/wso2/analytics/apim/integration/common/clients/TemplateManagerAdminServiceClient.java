/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.wso2.analytics.apim.integration.common.clients;

import org.apache.axis2.AxisFault;
import org.apache.axis2.client.ServiceClient;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ScenarioConfigurationInfoDTO;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ScenarioConfigurationDTO;
import org.wso2.carbon.event.template.manager.admin.dto.domain.xsd.DomainInfoDTO ;
import org.wso2.carbon.event.template.manager.stub.TemplateManagerAdminServiceStub;

import java.rmi.RemoteException;

public class TemplateManagerAdminServiceClient {
    private static final Log log = LogFactory.getLog(TemplateManagerAdminServiceClient.class);
    private final String serviceName = "TemplateManagerAdminService";
    private TemplateManagerAdminServiceStub templateManagerAdminServiceStub;
    private String endPoint;

    public TemplateManagerAdminServiceClient(String backEndUrl, String sessionCookie) throws AxisFault {
        this.endPoint = backEndUrl + serviceName;
        templateManagerAdminServiceStub = new TemplateManagerAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(sessionCookie, templateManagerAdminServiceStub);

    }

    public TemplateManagerAdminServiceClient(String backEndUrl, String userName, String password) throws AxisFault {
        this.endPoint = backEndUrl + serviceName;
        templateManagerAdminServiceStub = new TemplateManagerAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(userName, password, templateManagerAdminServiceStub);
    }

    public ServiceClient _getServiceClient() {
        return templateManagerAdminServiceStub._getServiceClient();
    }


    public DomainInfoDTO[] getAllDomains() throws RemoteException {
        try {
            return templateManagerAdminServiceStub.getAllDomainInfos();
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }

    public DomainInfoDTO getDomain(String domainName) throws RemoteException {
        try {
            return templateManagerAdminServiceStub.getDomainInfo(domainName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }


    public ScenarioConfigurationDTO getConfiguration(String domainName, String configurationName)
            throws RemoteException {
        try {
            return templateManagerAdminServiceStub.getConfiguration(domainName, configurationName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }

    public ScenarioConfigurationInfoDTO[] getConfigurations(String domainName) throws RemoteException {
        try {
            return templateManagerAdminServiceStub.getConfigurationInfos(domainName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }

    public String[] editConfiguration(ScenarioConfigurationDTO templateConfigDTO) throws RemoteException {
        try {
            return templateManagerAdminServiceStub.editConfiguration(templateConfigDTO);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }

    public boolean deleteConfiguration(String domainName, String configurationName) throws RemoteException {
        try {
            return templateManagerAdminServiceStub.deleteConfiguration(domainName, configurationName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }

    public int getConfigurationsCount(String domainName) throws RemoteException {
        int count = 0;
        try {
            ScenarioConfigurationInfoDTO[] configs = templateManagerAdminServiceStub.getConfigurationInfos(domainName);
            if (configs != null) {
                count = configs.length;
            }
            return count;
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException(e.getMessage(), e);
        }
    }
}