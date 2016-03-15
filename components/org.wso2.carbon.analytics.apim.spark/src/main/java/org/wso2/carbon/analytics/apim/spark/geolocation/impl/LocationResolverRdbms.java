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
package org.wso2.carbon.analytics.apim.spark.geolocation.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.Location;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolver;
import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.apim.spark.geolocation.holders.CacheHolder;
import org.wso2.carbon.analytics.apim.spark.geolocation.utils.DBUtil;

public class LocationResolverRdbms implements LocationResolver {
    private static final Log log = LogFactory.getLog(LocationResolverRdbms.class);
    private static boolean cacheEnabled;
    private static LRUCache<String, Location> cache;
    private static DBUtil dbUtil;

    public String getCountry(String ip) throws GeoLocationResolverException {
        Location location = null;
        cacheEnabled = CacheHolder.getInstance().isCacheEnabled();
        dbUtil = DBUtil.getInstance();
        if (cacheEnabled) {
            cache = CacheHolder.getInstance().getIpResolveCache();
            location = cache.get(ip);
        }
        if (location == null) {
            location = dbUtil.getLocation(ip);
            if (location != null) {
                if (cacheEnabled) {
                    cache.put(ip, location);
                }
            }
        }
        return location != null ? location.getCountry() : "";
    }

    public String getCity(String ip) throws GeoLocationResolverException {
        cacheEnabled = CacheHolder.getInstance().isCacheEnabled();
        dbUtil = DBUtil.getInstance();
        Location location = null;
        if (cacheEnabled) {
            cache = CacheHolder.getInstance().getIpResolveCache();
            location = cache.get(ip);
        }
        if (location == null) {
            location = dbUtil.getLocation(ip);
            if (location != null) {
                if (cacheEnabled) {
                    cache.put(ip, location);
                }
            }
        }
        return location != null ? location.getCity() : "";
    }

    public LocationResolverRdbms() {
    }
}
