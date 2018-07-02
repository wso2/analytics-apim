/*
* Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
package org.wso2.analytics.apim.file.adapter;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.analytics.apim.file.adapter.internal.ds.FileEventAdapterServiceValueHolder;
import org.wso2.analytics.apim.file.adapter.task.UploadedUsagePublisherExecutorTask;
import org.wso2.analytics.apim.file.adapter.util.FileEventAdapterConstants;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2.carbon.event.input.adapter.core.EventAdapterConstants;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapter;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapterConfiguration;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapterListener;
import org.wso2.carbon.event.input.adapter.core.exception.InputEventAdapterException;
import org.wso2.carbon.event.input.adapter.core.exception.InputEventAdapterRuntimeException;
import org.wso2.carbon.event.input.adapter.core.exception.TestConnectionNotSupportedException;

import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class FileEventAdapter implements InputEventAdapter {

    private static final Log log = LogFactory.getLog(FileEventAdapter.class);
    private final InputEventAdapterConfiguration eventAdapterConfiguration;
    private final Map<String, String> globalProperties;
    private InputEventAdapterListener inputEventAdapterListener;
    String tenantDomain;
    String streamId;
    int tenantId;

    public FileEventAdapter(InputEventAdapterConfiguration eventAdapterConfiguration, Map<String, String> globalProperties) {
        this.eventAdapterConfiguration = eventAdapterConfiguration;
        this.globalProperties = globalProperties;
    }

    @Override
    public void init(InputEventAdapterListener inputEventAdapterListener) throws InputEventAdapterException {
        this.inputEventAdapterListener = inputEventAdapterListener;
    }

    @Override
    public void testConnect() throws TestConnectionNotSupportedException {
        throw new TestConnectionNotSupportedException("not-supported");
    }

    @Override
    public void connect() throws InputEventAdapterRuntimeException {
        tenantDomain = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantDomain(true);
        tenantId = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId();
        streamId = eventAdapterConfiguration.getInputStreamIdOfWso2eventMessageFormat();
        FileEventAdapterServiceValueHolder.registerAdapterService(tenantDomain,streamId, this);
        readFileFromDatabase();
    }

    private void readFileFromDatabase() {
        TimerTask usagePublisherTask = new UploadedUsagePublisherExecutorTask(tenantDomain, tenantId);
        Timer timer = new Timer();
        String usagePublishFrequency = System
                .getProperty(FileEventAdapterConstants.UPLOADED_USAGE_PUBLISH_FREQUENCY_PROPERTY);
        if(StringUtils.isEmpty(usagePublishFrequency)) {
            log.debug("Default usage publishing frequency will be used");
            usagePublishFrequency = FileEventAdapterConstants.DEFAULT_UPLOADED_USAGE_PUBLISH_FREQUENCY;
        }
        timer.schedule(usagePublisherTask, 1000, Long.parseLong(usagePublishFrequency));
    }

    @Override
    public void disconnect() {
        String tenantDomain = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantDomain(true);
        String streamId = eventAdapterConfiguration.getInputStreamIdOfWso2eventMessageFormat();
        FileEventAdapterServiceValueHolder.unregisterAdapterService(tenantDomain, streamId, this);
    }

    @Override
    public void destroy() {

    }

    @Override
    public boolean isEventDuplicatedInCluster() {
        return Boolean.parseBoolean(eventAdapterConfiguration.getProperties().get(EventAdapterConstants.EVENTS_DUPLICATED_IN_CLUSTER));
    }

    @Override
    public boolean isPolling() {
        return false;
    }

    public String getEventAdapterName() {
        return eventAdapterConfiguration.getName();
    }

    public InputEventAdapterListener getInputEventAdapterListener() {
        return inputEventAdapterListener;
    }
}
