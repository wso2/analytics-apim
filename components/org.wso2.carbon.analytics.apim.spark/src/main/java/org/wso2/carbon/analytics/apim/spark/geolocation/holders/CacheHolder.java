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
package org.wso2.carbon.analytics.apim.spark.geolocation.holders;

import org.apache.axiom.om.OMElement;
import org.apache.axiom.om.impl.builder.StAXOMBuilder;
import org.apache.commons.io.FileUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.Location;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolver;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolverConstants;
import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.apim.spark.geolocation.impl.LRUCache;
import org.wso2.carbon.analytics.apim.spark.geolocation.utils.DBUtil;
import org.wso2.carbon.utils.CarbonUtils;
import org.wso2.carbon.utils.xml.StringUtils;

import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class CacheHolder {

    private static final CacheHolder instance = new CacheHolder();
    private static LRUCache<String, Location> ipResolveCache;
    private static LRUCache<String, Long> ipToLongCache;
    private static LocationResolver locationResolver;
    private static String clazzName;
    private static String dataSourceName;
    private static String restUrl;
    private static boolean cacheEnabled;
    private static boolean enablePersistenceInDb;
    private static final Log log = LogFactory.getLog(CacheHolder.class);

    private CacheHolder() {
    }


    public static CacheHolder getInstance() {
        return instance;
    }

    public LRUCache<String, Location> getIpResolveCache() {
        return ipResolveCache;
    }

    public LRUCache<String, Long> getIpToLongCache() {
        return ipToLongCache;
    }

    public LocationResolver getLocationResolver() {
        return locationResolver;
    }

    public boolean isCacheEnabled() {
        return cacheEnabled;
    }

    public boolean isEnablePersistenceInDb() {
        return enablePersistenceInDb;
    }

    static {
        InputStream in;
        String filePath = CarbonUtils.getCarbonHome() + File.separator + "repository" +
                File.separator + "conf" + File.separator + "etc" + File.separator + "geolocation.xml";
        try {
            in = FileUtils.openInputStream(new File(filePath));
            StAXOMBuilder builder = new StAXOMBuilder(in);
            String type = builder.getDocumentElement().getFirstChildWithName(new QName(LocationResolverConstants.TYPE))
                    .getText();
            clazzName = builder.getDocumentElement().getFirstChildWithName(new QName(LocationResolverConstants
                    .IMPL_CLASS))
                    .getText();
            OMElement dataSourceElement = builder.getDocumentElement().getFirstChildWithName(new QName
                    (LocationResolverConstants
                            .DATA_SOURCE));
            if (dataSourceElement != null) {
                dataSourceName = dataSourceElement.getText();
            }
            OMElement restUrlElement = builder.getDocumentElement().getFirstChildWithName(new QName
                    (LocationResolverConstants
                            .REST_URL));
            if (restUrlElement != null) {
                restUrl = restUrlElement.getText();
            }
            if (!StringUtils.isEmpty(clazzName)) {
                locationResolver = (LocationResolver) Class.forName(clazzName).newInstance();
            }
            if (LocationResolverConstants.Types.Type_RDBMS.equals(type)) {
                if (!StringUtils.isEmpty(dataSourceName)) {
                    DBUtil.getInstance().setDataSourceName(dataSourceName);
                    DBUtil.initialize();
                }
            }
            OMElement cacheElement = builder.getDocumentElement().getFirstChildWithName(new QName
                    (LocationResolverConstants.CACHE));
            if (cacheElement != null) {
                OMElement enabledElement = cacheElement.getFirstChildWithName(new QName(LocationResolverConstants
                        .CACHE_ENABLED));

                if (enabledElement != null) {
                    cacheEnabled = Boolean.parseBoolean(enabledElement.getText());
                }
                if (cacheEnabled) {
                    OMElement persistElement = cacheElement.getFirstChildWithName(new QName(LocationResolverConstants
                            .CACHE_PERSIST));

                    if (persistElement != null) {
                        enablePersistenceInDb = Boolean.parseBoolean(persistElement.getText());
                    }
                    OMElement ipToLongCacheElement = cacheElement.getFirstChildWithName(new QName
                            (LocationResolverConstants.CACHE_IP_TO_LONG_CACHE_COUNT));

                    if (ipToLongCacheElement != null) {
                        ipToLongCache = new LRUCache<String, Long>(Integer.parseInt(ipToLongCacheElement.getText()));
                    } else {
                        ipToLongCache = new LRUCache<String, Long>(10000);
                    }
                    OMElement ipResolveCacheElement = cacheElement.getFirstChildWithName(new QName
                            (LocationResolverConstants.CACHE_IP_RESOLVE_CACHE_COUNT));

                    if (ipResolveCacheElement != null) {
                        ipResolveCache = new LRUCache<String, Location>(Integer.parseInt(ipResolveCacheElement
                                .getText()));
                    } else {
                        ipResolveCache = new LRUCache<String, Location>(10000);
                    }
                }
            } else {
                cacheEnabled = true;
                enablePersistenceInDb = true;
                ipResolveCache = new LRUCache<String, Location>(10000);
                ipToLongCache = new LRUCache<String, Long>(10000);
            }
        } catch (IOException e) {
            log.error("Couldn't find the geolocation.xml in " + filePath, e);
        } catch (XMLStreamException e) {
            log.error("Couldn't read the geolocation.xml in " + filePath, e);
        } catch (ClassNotFoundException e) {
            log.error("Couldn't found Location Implementation from " + clazzName + " class.", e);
        } catch (GeoLocationResolverException e) {
            log.error("Couldn't initialize the data source from " + dataSourceName, e);
        } catch (IllegalAccessException e) {
            log.error("Couldn't access the Location Implementation from " + clazzName + " class.", e);
        } catch (InstantiationException e) {
            log.error("Couldn't initialize the Location Implementation from " + clazzName + " class.", e);
        }

    }
}
