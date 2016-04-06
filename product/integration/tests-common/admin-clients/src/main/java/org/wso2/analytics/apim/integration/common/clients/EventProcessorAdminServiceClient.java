package org.wso2.analytics.apim.integration.common.clients;

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
import org.apache.axis2.AxisFault;
        import org.apache.axis2.client.ServiceClient;
        import org.apache.commons.logging.Log;
        import org.apache.commons.logging.LogFactory;
        import org.wso2.carbon.event.processor.stub.EventProcessorAdminServiceStub;
        import org.wso2.carbon.event.processor.stub.types.ExecutionPlanConfigurationDto;
        import org.wso2.carbon.event.processor.stub.types.ExecutionPlanConfigurationFileDto;
        import org.wso2.carbon.event.processor.stub.types.StreamDefinitionDto;

        import java.rmi.RemoteException;

public class EventProcessorAdminServiceClient {
    private static final Log log = LogFactory.getLog(EventProcessorAdminServiceClient.class);
    private final String serviceName = "EventProcessorAdminService";
    private EventProcessorAdminServiceStub eventProcessorAdminServiceStub;
    private String endPoint;

    public EventProcessorAdminServiceClient(String backEndUrl, String sessionCookie) throws
            AxisFault {
        this.endPoint = backEndUrl + serviceName;
        eventProcessorAdminServiceStub = new EventProcessorAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(sessionCookie, eventProcessorAdminServiceStub);

    }

    public EventProcessorAdminServiceClient(String backEndUrl, String userName, String password)
            throws AxisFault {
        this.endPoint = backEndUrl + serviceName;
        eventProcessorAdminServiceStub = new EventProcessorAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(userName, password, eventProcessorAdminServiceStub);
    }

    public ServiceClient _getServiceClient() {
        return eventProcessorAdminServiceStub._getServiceClient();
    }

    public int getActiveExecutionPlanConfigurationCount()
            throws RemoteException {
        try {
            ExecutionPlanConfigurationDto[] configs = eventProcessorAdminServiceStub.getAllActiveExecutionPlanConfigurations();
            if (configs == null) {
                return 0;
            } else {
                return configs.length;
            }
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public int getInactiveExecutionPlanConfigurationCount()
            throws RemoteException {
        try {
            ExecutionPlanConfigurationFileDto[] configs = eventProcessorAdminServiceStub.getAllInactiveExecutionPlanConigurations();
            if (configs == null) {
                return 0;
            } else {
                return configs.length;
            }
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public int getExecutionPlanConfigurationCount()
            throws RemoteException {
        try {
            ExecutionPlanConfigurationFileDto[] configs = eventProcessorAdminServiceStub.getAllInactiveExecutionPlanConigurations();
            if (configs == null) {
                return getActiveExecutionPlanConfigurationCount();
            } else {
                return configs.length + getActiveExecutionPlanConfigurationCount();
            }
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public ExecutionPlanConfigurationDto getActiveExecutionPlanConfiguration(String executionPlanName)
            throws RemoteException {
        try {
            return eventProcessorAdminServiceStub.getActiveExecutionPlanConfiguration(executionPlanName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public String getActiveExecutionPlan(String executionPlanName)
            throws RemoteException {
        try {
            return eventProcessorAdminServiceStub.getActiveExecutionPlan(executionPlanName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public void addExecutionPlan(String executionPlan)
            throws RemoteException {
        try {
            eventProcessorAdminServiceStub.deployExecutionPlan(executionPlan);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public void removeActiveExecutionPlan(String planName)
            throws RemoteException {
        try {
            eventProcessorAdminServiceStub.undeployActiveExecutionPlan(planName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public void removeInactiveExecutionPlan(String filePath)
            throws RemoteException {
        try {
            eventProcessorAdminServiceStub.undeployInactiveExecutionPlan(filePath);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public void editActiveExecutionPlan(String executionPlan, String executionPlanName)
            throws RemoteException {
        try {
            eventProcessorAdminServiceStub.editActiveExecutionPlan(executionPlan, executionPlanName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public String validateExecutionPlan(String executionPlan) throws RemoteException {
        try {
            return eventProcessorAdminServiceStub.validateExecutionPlan(executionPlan);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }

    }

    public void setStatisticsEnabled(String executionPlanName, boolean isEnabled) throws RemoteException {
        try {
            eventProcessorAdminServiceStub.setStatisticsEnabled(executionPlanName, isEnabled);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public void setTracingEnabled(String executionPlanName, boolean isEnabled) throws RemoteException {
        try {
            eventProcessorAdminServiceStub.setTracingEnabled(executionPlanName, isEnabled);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public StreamDefinitionDto[] getSiddhiStreams(String executionPlan) throws RemoteException {
        try {
            return eventProcessorAdminServiceStub.getSiddhiStreams(executionPlan);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }

    public ExecutionPlanConfigurationDto[] getAllExportedStreamSpecificActiveExecutionPlanConfiguration(
            String streamId) throws RemoteException {
        try {
            return eventProcessorAdminServiceStub.getAllExportedStreamSpecificActiveExecutionPlanConfiguration(streamId);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw e;
        }
    }
}