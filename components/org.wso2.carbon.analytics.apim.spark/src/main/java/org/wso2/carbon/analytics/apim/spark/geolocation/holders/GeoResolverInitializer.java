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
import org.apache.axiom.om.OMNode;
import org.apache.axiom.om.impl.builder.StAXOMBuilder;
import org.apache.commons.io.FileUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.Location;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolver;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolverConstants;
import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.apim.spark.geolocation.impl.LRUCache;
import org.wso2.carbon.utils.CarbonUtils;
import org.wso2.carbon.utils.xml.StringUtils;

import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.Iterator;

public class GeoResolverInitializer {

    private static final GeoResolverInitializer instance = new GeoResolverInitializer();
    private static LRUCache<String, Location> ipResolveCache;
    private static LocationResolver locationResolver;
    private static String clazzName;
    private static boolean cacheEnabled;
    private static final Log log = LogFactory.getLog(GeoResolverInitializer.class);
    private static final QName PROP_Q = new QName("Property");
    private static final QName ATT_NAME = new QName("name");
    private static final QName ATT_CLASS = new QName("class");

    private GeoResolverInitializer() {
    }


    public static GeoResolverInitializer getInstance() {
        return instance;
    }

    public LRUCache<String, Location> getIpResolveCache() {
        return ipResolveCache;
    }

    public LocationResolver getLocationResolver() {
        return locationResolver;
    }

    public boolean isCacheEnabled() {
        return cacheEnabled;
    }

    static {
        InputStream in;
        String filePath = CarbonUtils.getCarbonHome() + File.separator + "repository" +
                File.separator + "conf" + File.separator + "etc" + File.separator + "geolocation.xml";
        try {
            in = FileUtils.openInputStream(new File(filePath));
            StAXOMBuilder builder = new StAXOMBuilder(in);

            OMElement implementationElement = builder.getDocumentElement().getFirstChildWithName(new QName
                    (LocationResolverConstants.IMPL_CLASS));
            clazzName = implementationElement.getAttributeValue(ATT_CLASS);
            if (!StringUtils.isEmpty(clazzName)) {
                locationResolver = (LocationResolver) Class.forName(clazzName).newInstance();
                loadProperties(implementationElement,locationResolver);
                locationResolver.init();
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
                ipResolveCache = new LRUCache<String, Location>(10000);
            }
        } catch (IOException e) {
            log.error("Couldn't find the geolocation.xml in " + filePath, e);
        } catch (XMLStreamException e) {
            log.error("Couldn't read the geolocation.xml in " + filePath, e);
        } catch (ClassNotFoundException e) {
            log.error("Couldn't found Location Implementation from " + clazzName + " class.", e);
        } catch (GeoLocationResolverException e) {
            log.error("Couldn't init Geolocation Resolver ", e);
        } catch (IllegalAccessException e) {
            log.error("Couldn't access the Location Implementation from " + clazzName + " class.", e);
        } catch (InstantiationException e) {
            log.error("Couldn't init the Location Implementation from " + clazzName + " class.", e);
        }
    }
    private static void loadProperties(OMElement implementationElement, Object implementationClass) throws
            GeoLocationResolverException {


        for (Iterator it = implementationElement.getChildrenWithName(PROP_Q); it.hasNext(); ) {
            OMElement propertyElem = (OMElement) it.next();
            String propName = propertyElem.getAttribute(ATT_NAME).getAttributeValue();
            if (propName == null) {
                throw new GeoLocationResolverException("An Implementation class property must specify the name " +
                        "attribute");
            } else {
                OMNode omElt = propertyElem.getFirstElement();
                if (omElt != null) {
                    setInstanceProperty(propName, omElt, implementationClass);
                } else if (propertyElem.getText() != null) {
                    String value = propertyElem.getText();
                    setInstanceProperty(propName, value, implementationClass);
                } else {
                    throw new GeoLocationResolverException("An Executor class property must specify " +
                            "name and text value, or a name and a child XML fragment");
                }
            }
        }
    }

    /**
     * Find and invoke the setter method with the name of form setXXX passing in the value given
     * on the POJO object
     *
     * @param name name of the setter field
     * @param val  value to be set
     * @param obj  POJO instance
     */
    public static void setInstanceProperty(String name, Object val, Object obj) throws GeoLocationResolverException {

        String mName = "set" + Character.toUpperCase(name.charAt(0)) + name.substring(1);
        Method method;

        try {
            Method[] methods = obj.getClass().getMethods();
            boolean invoked = false;

            for (Method method1 : methods) {
                if (mName.equals(method1.getName())) {
                    Class[] params = method1.getParameterTypes();
                    if (params.length != 1) {
                        throw new GeoLocationResolverException("Did not find a setter method named : " + mName +
                                "() that takes a single String, int, long, float, double ," +
                                "OMElement or boolean parameter");
                    } else if (val instanceof String) {
                        String value = (String) val;
                        if (String.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, String.class);
                            method.invoke(obj, new String[]{value});
                        } else if (int.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, int.class);
                            method.invoke(obj, new Integer[]{Integer.valueOf(value)});
                        } else if (long.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, long.class);
                            method.invoke(obj, new Long[]{Long.valueOf(value)});
                        } else if (float.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, float.class);
                            method.invoke(obj, new Float[]{new Float(value)});
                        } else if (double.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, double.class);
                            method.invoke(obj, new Double[]{new Double(value)});
                        } else if (boolean.class.equals(params[0])) {
                            method = obj.getClass().getMethod(mName, boolean.class);
                            method.invoke(obj, new Boolean[]{Boolean.valueOf(value)});
                        } else {
                            continue;
                        }
                    } else if (val instanceof OMElement && OMElement.class.equals(params[0])) {
                        method = obj.getClass().getMethod(mName, OMElement.class);
                        method.invoke(obj, new OMElement[]{(OMElement) val});
                    } else {
                        continue;
                    }
                    invoked = true;
                    break;
                }
            }
            if (!invoked) {
                throw new GeoLocationResolverException("Did not find a setter method named : " + mName +
                        "() that takes a single String, int, long, float, double " +
                        "or boolean parameter");
            }
        } catch (Exception e) {
            throw new GeoLocationResolverException("Error invoking setter method named : " + mName +
                    "() that takes a single String, int, long, float, double " +
                    "or boolean parameter", e);
        }
    }
}