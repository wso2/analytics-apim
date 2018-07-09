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
package org.wso2.analytics.apim.file.adapter.internal.ds;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.service.component.ComponentContext;
import org.wso2.analytics.apim.file.adapter.FileEventAdapterFactory;
import org.wso2.analytics.apim.file.adapter.exception.FileBasedAnalyticsException;
import org.wso2.analytics.apim.file.adapter.task.UploadedUsageCleanUpTask;
import org.wso2.analytics.apim.file.adapter.util.FileEventAdapterConstants;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapterFactory;
import org.wso2.carbon.event.stream.core.EventStreamService;

import java.util.Timer;
import java.util.TimerTask;

/**
 * @scr.component component.name="input.File.AdapterService.component" immediate="true"
 * @scr.reference name="eventStreamService.component"
 * interface="org.wso2.carbon.event.stream.core.EventStreamService"
 * cardinality="1..1" policy="dynamic" bind="setEventStreamService" unbind="unsetEventStreamService"
 */
public class FileEventAdapterServiceDS {

    private static final Log log = LogFactory.getLog(FileEventAdapterServiceDS.class);

    protected void activate(ComponentContext context) {
        try {
            InputEventAdapterFactory fileEventAdapterFactory = new FileEventAdapterFactory();
            context.getBundleContext()
                    .registerService(InputEventAdapterFactory.class.getName(), fileEventAdapterFactory, null);
            log.debug("Successfully deployed the FileEvent adapter service");

            //initiate the db cleanup task to run every hour
            TimerTask usageCleanupTask = new UploadedUsageCleanUpTask();
            Timer timer = new Timer();
            String usageCleanupFrequency = System
                    .getProperty(FileEventAdapterConstants.UPLOADED_USAGE_CLEANUP_FREQUENCY_PROPERTY);
            if (StringUtils.isEmpty(usageCleanupFrequency)) {
                usageCleanupFrequency = FileEventAdapterConstants.DEFAULT_UPLOADED_USAGE_CLEANUP_FREQUENCY;
            }
            timer.schedule(usageCleanupTask, 10000, Long.parseLong(usageCleanupFrequency));

        } catch (RuntimeException e) {
            log.error("Can not create the input FileEvent adapter service ", e);
        }
    }

    /**
     * Set EventStream service
     *
     * @param eventStreamService task service
     * @throws FileBasedAnalyticsException
     */
    protected void setEventStreamService(EventStreamService eventStreamService) throws FileBasedAnalyticsException {
        log.debug("EventStreamService is acquired");
        FileEventAdapterServiceValueHolder.setEventStreamService(eventStreamService);
    }

    /**
     * Remove EventStream service
     *
     * @param eventStreamService task service
     */
    protected void unsetEventStreamService(EventStreamService eventStreamService) {
        FileEventAdapterServiceValueHolder.setEventStreamService(null);
    }
}
