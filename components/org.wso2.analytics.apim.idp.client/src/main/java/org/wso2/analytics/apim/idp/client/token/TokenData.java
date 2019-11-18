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

/**
 *  Data about an access token.
 */
public class TokenData {

    /*
     * Example TokenData object ->
     *
     * TokenData{
     *  token='ce3b65dd-3ab8-3a9a-944f-18b2cf6b46dc',
     *  scopes='apim:api_view apim:subscribe apim_analytics:admin apim_analytics:analytics_viewer
     *      apim_analytics:api_developer apim_analytics:app_developer apim_analytics:devops_engineer
     *      apim_analytics:everyone apim_analytics:product_manager openid',
     *  expireTimestamp=1572954896
     *  }
     *
     * */

    private String token;
    private String scopes;
    private long expireTimestamp;

    public TokenData(String token, String scopes, long expireTimestamp) {
        this.token = token;
        this.scopes = scopes;
        this.expireTimestamp = expireTimestamp;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getScopes() {
        return scopes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    public long getExpireTimestamp() {
        return expireTimestamp;
    }

    public void setExpireTimestamp(long expireTimestamp) {
        this.expireTimestamp = expireTimestamp;
    }

    @Override
    public String toString() {
        return "TokenData{" +
                "token='" + token + '\'' +
                ", scopes='" + scopes + '\'' +
                ", expireTimestamp=" + expireTimestamp +
                '}';
    }
}
