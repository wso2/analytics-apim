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

import java.util.ArrayList;
import java.util.Objects;

/**
 * Model for DCR Client (OAuth2 Application).
 */
public final class DCRClientInfo {

    /**
     * Sample message to this method.
     * {
     * "callbackUrl": "www.google.lk",
     * "clientName": "mdm",
     * "tokenScope": "Production",
     * "owner": "admin",
     * "grantType": "password refresh_token",
     * "saasApp": true
     *}
     */

    @SerializedName("applicationType")
    private String applicationType;
    @SerializedName("redirectUris")
    private ArrayList<String> redirectUris;
    @SerializedName("clientName")
    private String clientName;
    @SerializedName("logoUri")
    private String logoUri;
    @SerializedName("subjectType")
    private String subjectType;
    @SerializedName("sectorIdentifierUri")
    private String sectorIdentifierUri;
    @SerializedName("tokenEndpointAuthMethod")
    private String tokenEndpointAuthMethod;
    @SerializedName("jwksUri")
    private String jwksUri;
    @SerializedName("userInfoEncryptedResponseAlg")
    private String userInfoEncryptedResponseAlg;
    @SerializedName("userInfoEncryptedResponseEnc")
    private String userInfoEncryptedResponseEnc;
    @SerializedName("contacts")
    private ArrayList<String> contacts;
    @SerializedName("requestUris")
    private ArrayList<String> requestUris;
    @SerializedName("owner")
    private String owner;
    @SerializedName("callbackUrl")
    private String callbackUrl;
    @SerializedName("tokenScope")
    private String tokenScope;
    @SerializedName("grantType")
    private String grantType;
    @SerializedName("saasApp")
    private boolean saasApp;
    @SerializedName("audience")
    private String audience;
    @SerializedName("tokenType")
    private String tokenType;


    public String getApplicationType() {
        return applicationType;
    }

    public void setApplicationType(String applicationType) {
        this.applicationType = applicationType;
    }

    public ArrayList<String> getRedirectUris() {
        return redirectUris;
    }

    public void setRedirectUris(ArrayList<String> redirectUris) {
        this.redirectUris = redirectUris;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getLogoUri() {
        return logoUri;
    }

    public void setLogoUri(String logoUri) {
        this.logoUri = logoUri;
    }

    public String getSubjectType() {
        return subjectType;
    }

    public void setSubjectType(String subjectType) {
        this.subjectType = subjectType;
    }

    public String getSectorIdentifierUri() {
        return sectorIdentifierUri;
    }

    public void setSectorIdentifierUri(String sectorIdentifierUri) {
        this.sectorIdentifierUri = sectorIdentifierUri;
    }

    public String getTokenEndpointAuthMethod() {
        return tokenEndpointAuthMethod;
    }

    public void setTokenEndpointAuthMethod(String tokenEndpointAuthMethod) {
        this.tokenEndpointAuthMethod = tokenEndpointAuthMethod;
    }

    public String getJwksUri() {
        return jwksUri;
    }

    public void setJwksUri(String jwksUri) {
        this.jwksUri = jwksUri;
    }

    public String getUserInfoEncryptedResponseAlg() {
        return userInfoEncryptedResponseAlg;
    }

    public void setUserInfoEncryptedResponseAlg(String userInfoEncryptedResponseAlg) {
        this.userInfoEncryptedResponseAlg = userInfoEncryptedResponseAlg;
    }

    public String getUserInfoEncryptedResponseEnc() {
        return userInfoEncryptedResponseEnc;
    }

    public void setUserInfoEncryptedResponseEnc(String userInfoEncryptedResponseEnc) {
        this.userInfoEncryptedResponseEnc = userInfoEncryptedResponseEnc;
    }

    public ArrayList<String> getContacts() {
        return contacts;
    }

    public void setContacts(ArrayList<String> contacts) {
        this.contacts = contacts;
    }

    public ArrayList<String> getRequestUris() {
        return requestUris;
    }

    public void setRequestUris(ArrayList<String> requestUris) {
        this.requestUris = requestUris;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }

    public String getTokenScope() {
        return tokenScope;
    }

    public void setTokenScope(String tokenScope) {
        this.tokenScope = tokenScope;
    }

    public String getGrantType() {
        return grantType;
    }

    public void setGrantType(String grantType) {
        this.grantType = grantType;
    }

    public boolean isSaasApp() {
        return saasApp;
    }

    public void setSaasApp(boolean saasApp) {
        this.saasApp = saasApp;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public void addCallbackUrl(String callback) {
        if (callback == null) {
            return;
        }
        if (redirectUris == null) {
            redirectUris = new ArrayList<>();
        }
        redirectUris.add(callback);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        DCRClientInfo that = (DCRClientInfo) o;
        return saasApp == that.saasApp &&
                Objects.equals(applicationType, that.applicationType) &&
                Objects.equals(redirectUris, that.redirectUris) &&
                Objects.equals(clientName, that.clientName) &&
                Objects.equals(logoUri, that.logoUri) &&
                Objects.equals(subjectType, that.subjectType) &&
                Objects.equals(sectorIdentifierUri, that.sectorIdentifierUri) &&
                Objects.equals(tokenEndpointAuthMethod, that.tokenEndpointAuthMethod) &&
                Objects.equals(jwksUri, that.jwksUri) &&
                Objects.equals(userInfoEncryptedResponseAlg, that.userInfoEncryptedResponseAlg) &&
                Objects.equals(userInfoEncryptedResponseEnc, that.userInfoEncryptedResponseEnc) &&
                Objects.equals(contacts, that.contacts) &&
                Objects.equals(requestUris, that.requestUris) &&
                Objects.equals(owner, that.owner) &&
                Objects.equals(callbackUrl, that.callbackUrl) &&
                Objects.equals(tokenScope, that.tokenScope) &&
                Objects.equals(grantType, that.grantType) &&
                Objects.equals(audience, that.audience) &&
                Objects.equals(tokenType, that.tokenType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(applicationType, redirectUris, clientName, logoUri, subjectType, sectorIdentifierUri,
                tokenEndpointAuthMethod, jwksUri, userInfoEncryptedResponseAlg, userInfoEncryptedResponseEnc, contacts,
                requestUris, owner, callbackUrl, tokenScope, grantType, saasApp, audience, tokenType);
    }
}
