/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

/**
 *  DTO for custom url info.
 */
public class CustomUrlInfo {

    @SerializedName("tenantDomain")
    private String tenantDomain;
    @SerializedName("tenantAdminUsername")
    private String tenantAdminUsername;
    @SerializedName("enabled")
    private boolean isEnabled;
    @SerializedName("devPortal")
    private CustomUrlInfoDevPortalDTO devPortalUrlDTO;

    public String getTenantDomain() {

        return tenantDomain;
    }

    public void setTenantDomain(String tenantDomain) {

        this.tenantDomain = tenantDomain;
    }

    public String getTenantAdminUsername() {

        return tenantAdminUsername;
    }

    public void setTenantAdminUsername(String tenantAdminUsername) {

        this.tenantAdminUsername = tenantAdminUsername;
    }

    public boolean isEnabled() {

        return isEnabled;
    }

    public void setEnabled(boolean enabled) {

        isEnabled = enabled;
    }

    public CustomUrlInfoDevPortalDTO getDevPortalUrlDTO() {

        return devPortalUrlDTO;
    }

    public void setDevPortalUrlDTO(CustomUrlInfoDevPortalDTO devPortalUrlDTO) {

        this.devPortalUrlDTO = devPortalUrlDTO;
    }
}
