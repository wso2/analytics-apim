/*
* Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.rest.api.config.internal;


import org.wso2.carbon.config.provider.ConfigProvider;

/**
 *  Service Holder class for this component
 */
public class ServiceHolder {
    private static ServiceHolder instance = new ServiceHolder();
    private ConfigProvider configProvider;

    private ServiceHolder() {
    }

    /**
     * Provide instance of ServiceHolder class.
     *
     * @return Instance of ServiceHolder
     */
    public static ServiceHolder getInstance() {
        return instance;
    }

    /**
     * Return the configProvider object
     *
     * @return the configProvider object
     */
    public ConfigProvider getConfigProvider() {
        return configProvider;
    }

    /**
     * Set the configProvider object
     *
     * @param configProvider configProvider object
     */
    public void setConfigProvider(ConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

}
