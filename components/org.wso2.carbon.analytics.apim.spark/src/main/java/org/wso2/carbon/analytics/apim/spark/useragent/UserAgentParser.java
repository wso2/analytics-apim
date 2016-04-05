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

package org.wso2.carbon.analytics.apim.spark.useragent;

import org.wso2.carbon.analytics.spark.core.udf.CarbonUDF;
import ua_parser.OS;
import ua_parser.Parser;
import ua_parser.UserAgent;

public class UserAgentParser implements CarbonUDF {

    /**
     * This method would extract the Operating system form the given User-Agent String.
     *
     * @param userAgent The User-Agent string that is been sent.
     *                  Ex:- Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/48.0.2564.116 Chrome/48.0.2564.116 Safari/537.36
     * @return The name of the Operating system extracted from the User-Agent.
     */
    public String getOSFromUserAgent(String userAgent){
        Parser parser = UserAgentInitializer.getInstance().getUaParser();
        if (parser != null) {
            OS operatingSystem = parser.parseOS(userAgent);
            if (operatingSystem != null) {
                return operatingSystem.family;
            }
        }
        return null;
    }

    /**
     * This method would extract the browser form the given User-Agent String.
     *
     * @param userAgent The User-Agent string that is been sent.
     *                  Ex:- Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/48.0.2564.116 Chrome/48.0.2564.116 Safari/537.36
     * @return The name of the browser extracted from the User-Agent.
     */
    public String getBrowserFromUserAgent(String userAgent){
        Parser parser = UserAgentInitializer.getInstance().getUaParser();
        if (parser != null) {
            UserAgent agent = parser.parseUserAgent(userAgent);
            if (agent != null) {
                return agent.family;
            }
        }
        return null;
    }
}
