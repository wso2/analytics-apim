/*
*  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  WSO2 Inc. licenses this file to you under the Apache License,
*  Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License.
*  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
package org.wso2.carbon.analytics.apim.spark.geolocation.api;

import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;

public interface LocationResolver {
    /**
     * Extract the Country from IP
     *
     * @param ip ip address
     * @return Country
     */
    public abstract String getCountry(String ip) throws GeoLocationResolverException;

    /**
     * Extract the City from IP
     *
     * @param ip ip address
     * @return City
     */
    public abstract String getCity(String ip) throws GeoLocationResolverException;
}
