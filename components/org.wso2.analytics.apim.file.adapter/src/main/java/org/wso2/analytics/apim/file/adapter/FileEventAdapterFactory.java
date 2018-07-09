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

import org.wso2.analytics.apim.file.adapter.util.FileEventAdapterConstants;
import org.wso2.carbon.event.input.adapter.core.EventAdapterConstants;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapter;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapterConfiguration;
import org.wso2.carbon.event.input.adapter.core.InputEventAdapterFactory;
import org.wso2.carbon.event.input.adapter.core.MessageType;
import org.wso2.carbon.event.input.adapter.core.Property;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

public class FileEventAdapterFactory extends InputEventAdapterFactory {

    ResourceBundle resourceBundle = ResourceBundle
            .getBundle("org.wso2.analytics.apim.file.adapter.Resources", Locale.getDefault());

    @Override public String getType() {
        return FileEventAdapterConstants.ADAPTER_TYPE_MGW_FILE;
    }

    @Override public List<String> getSupportedMessageFormats() {
        List<String> supportInputMessageTypes = new ArrayList<String>();
        supportInputMessageTypes.add(MessageType.WSO2EVENT);
        return supportInputMessageTypes;
    }

    @Override public List<Property> getPropertyList() {
        List<Property> propertyList = new ArrayList<Property>();

        Property isDuplicatedInCluster = new Property(EventAdapterConstants.EVENTS_DUPLICATED_IN_CLUSTER);
        isDuplicatedInCluster
                .setDisplayName(resourceBundle.getString(EventAdapterConstants.EVENTS_DUPLICATED_IN_CLUSTER));
        isDuplicatedInCluster.setRequired(false);
        isDuplicatedInCluster.setHint(
                resourceBundle.getString(FileEventAdapterConstants.ADAPTER_IS_EVENTS_DUPLICATED_IN_CLUSTER_HINT));
        isDuplicatedInCluster.setOptions(new String[] { "true", "false" });
        isDuplicatedInCluster.setDefaultValue("false");
        propertyList.add(isDuplicatedInCluster);
        return propertyList;
    }

    @Override public String getUsageTips() {
        return null;
    }

    @Override public InputEventAdapter createEventAdapter(InputEventAdapterConfiguration inputEventAdapterConfiguration,
            Map<String, String> globalProperties) {
        return new FileEventAdapter(inputEventAdapterConfiguration, globalProperties);
    }
}
