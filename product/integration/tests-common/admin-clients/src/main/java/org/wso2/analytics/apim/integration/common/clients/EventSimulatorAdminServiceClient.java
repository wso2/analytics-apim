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
import org.wso2.carbon.event.simulator.stub.EventSimulatorAdminServiceStub;
import org.wso2.carbon.event.simulator.stub.types.DataSourceTableAndStreamInfoDto;
import org.wso2.carbon.event.simulator.stub.types.EventDto;
import org.wso2.carbon.event.simulator.stub.types.StreamDefinitionInfoDto;

import java.rmi.RemoteException;

public class EventSimulatorAdminServiceClient {
    private static final Log log = LogFactory.getLog(EventSimulatorAdminServiceClient.class);
    private final String serviceName = "EventSimulatorAdminService";
    private EventSimulatorAdminServiceStub executionSimulatorAdminServiceStub;
    private String endPoint;

    public EventSimulatorAdminServiceClient(String backEndUrl, String sessionCookie)
            throws AxisFault {
        this.endPoint = backEndUrl + serviceName;
        executionSimulatorAdminServiceStub = new EventSimulatorAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(sessionCookie, executionSimulatorAdminServiceStub);
    }

    public EventSimulatorAdminServiceClient(String backEndUrl, String userName, String password)
            throws AxisFault {
        this.endPoint = backEndUrl + serviceName;
        executionSimulatorAdminServiceStub = new EventSimulatorAdminServiceStub(endPoint);
        AuthenticateStubUtil.authenticateStub(userName, password, executionSimulatorAdminServiceStub);
    }

    public ServiceClient _getServiceClient() {
        return executionSimulatorAdminServiceStub._getServiceClient();
    }

    public void sendEvent(EventDto eventDto) throws RemoteException {
        try {
            executionSimulatorAdminServiceStub.sendEvent(eventDto);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public StreamDefinitionInfoDto[] getAllEventStreamInfoDto() throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.getAllEventStreamInfoDto();
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public String testSimulateRDBMSDataSourceConnection(String eventStreamDataSourceColumnNamesAndTypeInfo)
            throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.testSimulateRDBMSDataSourceConnection(
                    eventStreamDataSourceColumnNamesAndTypeInfo);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public DataSourceTableAndStreamInfoDto[] getAllDataSourceTableAndStreamInfo() throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.getAllDataSourceTableAndStreamInfo();
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public boolean saveDataSourceConfigDetails(String eventStreamDataSourceColumnNamesAndTypeInfo)
            throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.saveDataSourceConfigDetails(
                    eventStreamDataSourceColumnNamesAndTypeInfo);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public boolean sendDBConfigFileNameToSimulate(String fileName)
            throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.sendDBConfigFileNameToSimulate(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public boolean deleteDBConfigFile(String fileName)
            throws RemoteException {
        try {
            return executionSimulatorAdminServiceStub.deleteDBConfigFile(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public boolean sendConfigDetails(String fileName, String streamId, String separateChar, long delayBetweenEventsInMilies) throws RemoteException {
        try {
            executionSimulatorAdminServiceStub.sendConfigDetails(fileName, streamId, separateChar, delayBetweenEventsInMilies);
            return true;
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public void sendEventsViaFile(String fileName) throws RemoteException{
        try {
            executionSimulatorAdminServiceStub.sendEventsViaFile(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public void pauseEventsViaFile(String fileName) throws RemoteException{
        try {
            executionSimulatorAdminServiceStub.pauseEventsViaFile(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }

    public void resumeEventsViaFile(String fileName) throws RemoteException{
        try {
            executionSimulatorAdminServiceStub.resumeEventsViaFile(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }


    public boolean deleteFile(String fileName) throws RemoteException{
        try {
            return executionSimulatorAdminServiceStub.deleteFile(fileName);
        } catch (RemoteException e) {
            log.error("RemoteException", e);
            throw new RemoteException();
        }
    }
}