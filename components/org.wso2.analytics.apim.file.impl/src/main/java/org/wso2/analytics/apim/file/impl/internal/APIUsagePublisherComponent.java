/*
 * Copyright (c) 2018 WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.file.impl.internal;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.service.component.ComponentContext;
import org.wso2.analytics.apim.file.impl.config.ConfigManager;
import org.wso2.analytics.apim.file.impl.exception.FileBasedAnalyticsException;
import org.wso2.analytics.apim.file.impl.task.UploadedUsagePublisherExecutorTask;
import org.wso2.analytics.apim.file.impl.util.FileBasedAnalyticsConstants;
import org.wso2.carbon.ntask.core.service.TaskService;
import org.wso2.carbon.registry.core.exceptions.RegistryException;

import java.util.Timer;
import java.util.TimerTask;

/**
 * @scr.component name="micro.api.gateway.usage.component" immediate="true"
 * @scr.reference name="ntask.component"
 * interface="org.wso2.carbon.ntask.core.service.TaskService"
 * cardinality="1..1" policy="dynamic" bind="setTaskService" unbind="unsetTaskService"
 */
public class APIUsagePublisherComponent {

    private static final Log log = LogFactory.getLog(APIUsagePublisherComponent.class);

    protected void activate(ComponentContext ctx) {

        //Scheduling a timer task for publishing uploaded on-premise gw's usage data if
        //usage data publishing is enabled thorough a property.
        try {
            ConfigManager configManager = ConfigManager.getConfigManager();
            String isUsageDataPublishingEnabled = configManager
                    .getProperty(FileBasedAnalyticsConstants.IS_UPLOADED_USAGE_DATA_PUBLISH_ENABLED_PROPERTY);
            if (StringUtils.equals("true", isUsageDataPublishingEnabled)) {
                int usagePublishFrequency = FileBasedAnalyticsConstants.DEFAULT_UPLOADED_USAGE_PUBLISH_FREQUENCY;
                String usagePublishFrequencyProperty = configManager
                        .getProperty(FileBasedAnalyticsConstants.UPLOADED_USAGE_PUBLISH_FREQUENCY_PROPERTY);
                if (StringUtils.isNotBlank(usagePublishFrequencyProperty)) {
                    try {
                        usagePublishFrequency = Integer.parseInt(usagePublishFrequencyProperty);
                    } catch (NumberFormatException e) {
                        log.error("Error while parsing the system property: "
                                + FileBasedAnalyticsConstants.UPLOADED_USAGE_PUBLISH_FREQUENCY_PROPERTY
                                + " to integer. Using default usage publish frequency configuration: "
                                + FileBasedAnalyticsConstants.DEFAULT_UPLOADED_USAGE_PUBLISH_FREQUENCY, e);
                    }
                }
                TimerTask usagePublisherTask = new UploadedUsagePublisherExecutorTask();
                Timer timer = new Timer();
                timer.schedule(usagePublisherTask, 5000, usagePublishFrequency);
            } else {
                if (log.isDebugEnabled()) {
                    log.debug("Micro GW API Usage data publishing is disabled.");
                }
            }
        } catch (FileBasedAnalyticsException e) {
            log.error("Unexpected error occurred while reading properties from the config file. Micro GW API Usage "
                    + "data publishing is disabled.", e);
        }
        if (log.isDebugEnabled()) {
            log.debug("Micro gateway API Usage Publisher bundle is activated.");
        }
    }

    protected void deactivate(ComponentContext ctx) {
        if (log.isDebugEnabled()) {
            log.debug("Micro gateway API Usage Publisher bundle is de-activated ");
        }
    }

    /**
     * Set task service
     *
     * @param taskService task service
     * @throws RegistryException
     */
    protected void setTaskService(TaskService taskService) throws RegistryException {
        if (log.isDebugEnabled()) {
            log.debug("TaskService is acquired");
        }
        ServiceReferenceHolder.getInstance().setTaskService(taskService);
    }

    /**
     * Remove task service
     *
     * @param taskService task service
     */
    protected void unsetTaskService(TaskService taskService) {
        ServiceReferenceHolder.getInstance().setTaskService(null);
    }
}
