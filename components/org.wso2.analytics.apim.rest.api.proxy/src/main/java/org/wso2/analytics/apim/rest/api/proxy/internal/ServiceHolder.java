/*
* Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.rest.api.proxy.internal;


import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.kernel.config.model.CarbonConfiguration;

/**
 *  Service Holder class for this component
 */
public class ServiceHolder {
    private static ServiceHolder instance = new ServiceHolder();
    private final Log log = LogFactory.getLog(ServiceHolder.class);
    private ConfigProvider configProvider;
    private CarbonConfiguration carbonConfiguration;
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
     * Return the CarbonConfiguration object
     *
     * @return the CarbonConfiguration object
     */
    public CarbonConfiguration getCarbonConfiguration() {
        return carbonConfiguration;
    }

    /**
     * Set the configProvider object
     *
     * @param configProvider configProvider object
     */
    public void setConfigProvider(ConfigProvider configProvider) {
        try {
            this.carbonConfiguration = configProvider.getConfigurationObject(CarbonConfiguration.class);
            this.configProvider = configProvider;
        }  catch (ConfigurationException e) {
            log.error("Error occurred while initializing service holder for carbon configuration : " + e.getMessage(), e);
        }
    }

}
