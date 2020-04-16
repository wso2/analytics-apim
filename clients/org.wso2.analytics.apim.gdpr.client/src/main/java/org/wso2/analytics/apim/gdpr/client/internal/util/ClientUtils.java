/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
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
package org.wso2.analytics.apim.gdpr.client.internal.util;

import org.apache.commons.validator.routines.InetAddressValidator;

import java.util.Random;

/**
 * Utility class for APIM GDPR client.
 */
public class ClientUtils {

    /**
     * This methods generates invalid random IP address which will be used as a pseudonym value for user IP.
     * @param min upper bound of the range
     * @param max lower bound of the range
     * **/
    public static String generateRandomIP(int min, int max) {
        Random r = new Random();
        return (r.nextInt((max - min) + 1) + min)
                + "."
                + (r.nextInt((max - min) + 1) + min)
                + "."
                + (r.nextInt((max - min) + 1) + min)
                + "."
                + (r.nextInt((max - min) + 1) + min);
    }

    public static boolean isIPValid(String ip) {
        return InetAddressValidator.getInstance().isValid(ip);
    }
}
