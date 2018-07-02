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
import org.wso2.analytics.apim.file.impl.util.FileBasedAnalyticsConstants;
import org.wso2.carbon.event.stream.core.EventStreamService;
import org.wso2.carbon.user.core.service.RealmService;

/**
 * @scr.component name="micro.api.gateway.usage.component" immediate="true"
 * @scr.reference name="eventStreamService.component"
 * interface="org.wso2.carbon.event.stream.core.EventStreamService"
 * cardinality="1..1" policy="dynamic" bind="setEventStreamService" unbind="unsetEventStreamService"
 * @scr.reference name="user.realm.service"
 * interface="org.wso2.carbon.user.core.service.RealmService"
 * cardinality="1..1" policy="dynamic" bind="setRealmService" unbind="unsetRealmService"
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
     * Set EventStream service
     *
     * @param eventStreamService task service
     * @throws FileBasedAnalyticsException
     */
    protected void setEventStreamService(EventStreamService eventStreamService) throws FileBasedAnalyticsException {
        //if (log.isDebugEnabled()) {
            log.info("EventStreamService is acquired");
        //}
        ServiceReferenceHolder.getInstance().setEventStreamService(eventStreamService);
    }

    /**
     * Remove EventStream service
     *
     * @param eventStreamService task service
     */
    protected void unsetEventStreamService(EventStreamService eventStreamService) {
        ServiceReferenceHolder.getInstance().setEventStreamService(null);
    }

    /**
     * Set the RealmService to the the bundle's {@link ServiceReferenceHolder}
     *
     * @param realmService Realm Service
     */
    protected void setRealmService(RealmService realmService) {
        if (realmService != null && log.isDebugEnabled()) {
            log.debug("Realm service initialized");
        }
        ServiceReferenceHolder.getInstance().setRealmService(realmService);
    }

    /**
     * Unset the RealmService in the the bundle's {@link ServiceReferenceHolder}
     *
     * @param realmService Realm Service
     */
    protected void unsetRealmService(RealmService realmService) {
        ServiceReferenceHolder.getInstance().setRealmService(null);
    }

}
