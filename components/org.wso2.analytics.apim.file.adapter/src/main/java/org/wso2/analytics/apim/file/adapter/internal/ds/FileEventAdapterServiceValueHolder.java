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

import org.wso2.analytics.apim.file.adapter.FileEventAdapter;
import org.wso2.carbon.event.stream.core.EventStreamService;

import java.util.concurrent.ConcurrentHashMap;

public final class FileEventAdapterServiceValueHolder {

    private static ConcurrentHashMap<String, ConcurrentHashMap<String, ConcurrentHashMap<String, FileEventAdapter>>> inputEventAdapterListenerMap = new ConcurrentHashMap<>();
    private static EventStreamService eventStreamService;

    private FileEventAdapterServiceValueHolder() {
    }

    public static synchronized void registerAdapterService(String tenantDomain, String streamId,
            FileEventAdapter fileEventAdapter) {

        ConcurrentHashMap<String, ConcurrentHashMap<String, FileEventAdapter>> tenantSpecificInputEventAdapterListenerMap = inputEventAdapterListenerMap
                .get(tenantDomain);

        if (tenantSpecificInputEventAdapterListenerMap == null) {
            tenantSpecificInputEventAdapterListenerMap = new ConcurrentHashMap<>();
            inputEventAdapterListenerMap.put(tenantDomain, tenantSpecificInputEventAdapterListenerMap);
        }
        ConcurrentHashMap<String, FileEventAdapter> streamSpecificInputEventAdapterListenerMap = tenantSpecificInputEventAdapterListenerMap
                .get(streamId);
        if (streamSpecificInputEventAdapterListenerMap == null) {
            streamSpecificInputEventAdapterListenerMap = new ConcurrentHashMap<>();
            tenantSpecificInputEventAdapterListenerMap.put(streamId, streamSpecificInputEventAdapterListenerMap);
        }
        streamSpecificInputEventAdapterListenerMap.put(fileEventAdapter.getEventAdapterName(), fileEventAdapter);

    }

    public static void unregisterAdapterService(String tenantDomain, String streamId,
            FileEventAdapter fileEventAdapter) {
        ConcurrentHashMap<String, ConcurrentHashMap<String, FileEventAdapter>> tenantSpecificInputEventAdapterListenerMap = inputEventAdapterListenerMap
                .get(tenantDomain);

        if (tenantSpecificInputEventAdapterListenerMap != null) {
            ConcurrentHashMap<String, FileEventAdapter> streamSpecificInputEventAdapterListenerMap = tenantSpecificInputEventAdapterListenerMap
                    .get(streamId);
            if (streamSpecificInputEventAdapterListenerMap != null) {
                streamSpecificInputEventAdapterListenerMap.remove(fileEventAdapter.getEventAdapterName());
            }
        }
    }

    public static ConcurrentHashMap<String, FileEventAdapter> getAdapterService(String tenantDomain, String streamId) {
        ConcurrentHashMap<String, ConcurrentHashMap<String, FileEventAdapter>> tenantSpecificInputEventAdapterListenerMap = inputEventAdapterListenerMap
                .get(tenantDomain);
        if (tenantSpecificInputEventAdapterListenerMap != null) {
            return tenantSpecificInputEventAdapterListenerMap.get(streamId);
        }
        return null;
    }

    public static void setEventStreamService(EventStreamService eventStreamService) {
        FileEventAdapterServiceValueHolder.eventStreamService = eventStreamService;
    }

    public static EventStreamService getEventStreamService() {
        return eventStreamService;
    }
}
