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

import org.wso2.carbon.event.stream.core.EventStreamService;
import org.wso2.carbon.user.core.service.RealmService;

/**
 * ServiceReferenceHolder
 */
public class ServiceReferenceHolder {

    private static final ServiceReferenceHolder instance = new ServiceReferenceHolder();

    private EventStreamService eventStreamService;
    private RealmService realmService;

    private ServiceReferenceHolder() {

    }

    public RealmService getRealmService() {
        return realmService;
    }


    public static ServiceReferenceHolder getInstance() {
        return instance;
    }


    /**
     * Get task service
     *
     * @return TaskService
     */
    public EventStreamService getCarbonEventStreamServiceService() {
        return eventStreamService;
    }

    /**
     * Set task service
     *
     * @param eventStreamService task service
     */
    public void setEventStreamService(EventStreamService eventStreamService) {
        this.eventStreamService = eventStreamService;
    }

    public void setRealmService(RealmService realmService) {
        this.realmService = realmService;
    }

}
