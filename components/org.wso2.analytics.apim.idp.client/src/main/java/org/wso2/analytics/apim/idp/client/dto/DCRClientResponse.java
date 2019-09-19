/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.analytics.apim.idp.client.dto;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Model for DCR Client (OAuth2 Application).
 */
public final class DCRClientResponse {

    /**
     * Sample message to this method.
     * {
     * "clientId":"R8I3wI_OOFf4eWQaBu6Buznoy9ga",
     * "clientName":"admin_abc",
     * "callBackURL":"regexp=(/services/auth/callback/login|/services/auth/callback/logout)",
     * "clientSecret":"2oZDSWC76wv3BRG7i7O7sXRD16Ua",
     * "isSaasApplication":true,
     * "appOwner":null,
     * "jsonString":"{\"grant_types\":\"password refresh_token\"}",
     * "jsonAppAttribute":"{}",
     * "tokenType":null
     * }
     */

    @SerializedName("clientId")
    private String clientId;
    @SerializedName("clientName")
    private String clientName;
    @SerializedName("callBackURL")
    private String callBackURL;
    @SerializedName("clientSecret")
    private String clientSecret;
    @SerializedName("isSaasApplication")
    private boolean isSaasApplication;
    @SerializedName("appOwner")
    private String appOwner;
    @SerializedName("tokenType")
    private String tokenType;
    @SerializedName("jsonAppAttribute")
    private Object jsonAppAttribute;
    @SerializedName("jsonString")
    private String jsonString;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getCallbackUrl() {
        return callBackURL;
    }

    public void setCallbackUrl(String callBackURL) {
        this.callBackURL = callBackURL;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public boolean isSaasApplication() {
        return isSaasApplication;
    }

    public void setSaasApplication(boolean saasApplication) {
        isSaasApplication = saasApplication;
    }

    public String getAppOwner() {
        return appOwner;
    }

    public void setAppOwner(String appOwner) {
        this.appOwner = appOwner;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Object getJsonAppAttribute() {
        return jsonAppAttribute;
    }

    public void setJsonAppAttribute(Object jsonAppAttribute) {
        this.jsonAppAttribute = jsonAppAttribute;
    }

    public String getJsonString() {
        return jsonString;
    }

    public void setJsonString(String jsonString) {
        this.jsonString = jsonString;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        DCRClientResponse that = (DCRClientResponse) o;
        return isSaasApplication == that.isSaasApplication &&
                Objects.equals(clientId, that.clientId) &&
                Objects.equals(clientName, that.clientName) &&
                Objects.equals(callBackURL, that.callBackURL) &&
                Objects.equals(clientSecret, that.clientSecret) &&
                Objects.equals(appOwner, that.appOwner) &&
                Objects.equals(tokenType, that.tokenType) &&
                Objects.equals(jsonAppAttribute, that.jsonAppAttribute) &&
                Objects.equals(jsonString, that.jsonString);
    }

    @Override
    public int hashCode() {
        return Objects.hash(clientId, clientName, callBackURL, clientSecret, isSaasApplication, appOwner, tokenType,
                jsonAppAttribute, jsonString);
    }
}
