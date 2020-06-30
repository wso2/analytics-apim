/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.idp.client.token;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 *  Singleton which stores the token data in a map.
 */
public class TokenDataHolder {

    private static final Logger LOG = LoggerFactory.getLogger(TokenDataHolder.class);
    private static Map<String, TokenData> tokenDataMap = new ConcurrentHashMap<>();
    private static TokenDataHolder instance = new TokenDataHolder();

    private TokenDataHolder() {

    }

    /**
     * This method can be used to get the singleton instance of this class.
     * @return the singleton instance.
     */
    public static TokenDataHolder getInstance() {
        return instance;
    }

    /**
     * Adds a given key, value pair to the map.
     * @param key name of the user which the access token belongs to.
     * @param value data of the token.
     */
    public void addTokenDataToMap(String key, TokenData value) {
        if (key != null && value != null) {
            tokenDataMap.put(key, value);
            LOG.debug("Adding token data key, value pair to the token map :" + key + " , " + value.toString());
        }
    }

    /**
     * Removes a given key, value pair from the map.
     * @param key name of the user which the access token belongs to.
     */
    public void removeTokenDataFromMap(String key) {
        if (key != null) {
            tokenDataMap.remove(key);
            LOG.debug("Removed token data key, value pair from the token map for key:" + key + ".");
        }
    }

    /**
     * Fetches the token map.
     * @return tokenDataMap
     */
    public Map<String, TokenData> getTokenMap() {
        return tokenDataMap;
    }
}
