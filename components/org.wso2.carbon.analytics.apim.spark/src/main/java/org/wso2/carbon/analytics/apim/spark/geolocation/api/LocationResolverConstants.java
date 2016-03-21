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

public class LocationResolverConstants {
    public static final String TYPE = "Type";
    public static final String REST_URL = "RestUrl";
    public static final String IMPL_CLASS = "ImplClass";
    public static final String DATA_SOURCE = "DataSource";
    public static final String CACHE = "Cache";
    public static final String CACHE_ENABLED = "enabled";
    public static final String CACHE_IP_RESOLVE_CACHE_COUNT = "IpResolveCacheCount";
    public static final String CACHE_IP_TO_LONG_CACHE_COUNT = "IpToLongCacheCount";
    public static final String CACHE_PERSIST = "persist";

    public static class Types {
        public static final String Type_RDBMS = "RDBMS";
    }

}

