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

import java.util.Iterator;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 *  Responsible to remove expired access tokens from the tokenData map.
 */
public class TokenDataMapCleaner extends TimerTask {

    private static final Logger log = LoggerFactory.getLogger(TokenDataMapCleaner.class);

    @Override
    public void run() {
        log.debug("Starting token data map cleaner task.");
        cleanTokenDataMap();
    }

    private void cleanTokenDataMap() {
        long currentTimestamp = System.currentTimeMillis();
        Map<String, TokenData> tokenDataMap = TokenDataHolder.getInstance().getTokenMap();
        Iterator<Map.Entry<String, TokenData>> it = tokenDataMap.entrySet().iterator();
        int count = 0;
        while (it.hasNext()) {
            Map.Entry<String, TokenData> entry = it.next();
            TokenData tokenData = entry.getValue();
            long expiryTime = tokenData.getExpireTimestamp() * 1000;
            if (currentTimestamp > expiryTime) { // if token is expired, remove token data from the tokeData map
                it.remove();
                if (log.isDebugEnabled()) {
                    log.debug("Removed entry : " + entry.getKey());
                }
                count++;
            }
        }
        if (log.isDebugEnabled()) {
            log.debug("Number of removed tokens from the tokenData map : " + count);
        }
    }

    /**
     * Starts the timer task to clean the Token data map.
     */
    public void startTokenDataMapCleaner() {
        // Thread starts after 2 minutes and runs every 45 minutes
        new Timer().schedule(this, 120000, 2700000);
    }
}
