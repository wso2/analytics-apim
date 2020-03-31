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
package org.wso2.analytics.apim.gdpr.client;

/**
 * GDPR client constants.
 */
public class GDPRClientConstants {

    public static final String AT = "@";
    public static final String TABLE_NAME_PLACEHOLDER = "{{TABLE_NAME}}";
    public static final String USERNAME_COLUMN_NAME_PLACEHOLDER = "{{USERNAME_COLUMN_NAME}}";
    public static final String CURRENT_USERNAME_VALUE_PLACEHOLDER = "{{CURRENT_USERNAME_VALUE}}";
    public static final String PSEUDONYM_USERNAME_VALUE_PLACEHOLDER = "{{PSEUDONYM_USERNAME_VALUE}}";
    public static final String TENANT_DOMAIN_COLUMN_NAME_PLACEHOLDER = "{{TENANT_DOMAIN_COLUMN_NAME}}";
    public static final String TENANT_DOMAIN_VALUE_PLACEHOLDER = "{{TENANT_DOMAIN_VALUE}}";
    public static final String TENANT_ID_PLACEHOLDER = "{{TENANT_ID}";
    public static final String TABLE_CHECK_QUERY = "TABLE_CHECK";
    public static final String UPDATE_USERNAME_WITH_TENANT_DOMAIN_QUERY = "UPDATE_USERNAME_WITH_TENANT_DOMAIN";
    public static final String UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN_QUERY = "UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN";
    public static final String UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_DOMAIN_QUERY
            = "UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_DOMAIN";
    public static final String UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN_WHERE_TENANT_DOMAIN_QUERY
            = "UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN_WHERE_TENANT_DOMAIN_QUERY";
    public static final String UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_ID_QUERY
            = "UPDATE_USERNAME_WITH_TENANT_DOMAIN_WHERE_TENANT_ID";
    public static final String UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN_WHERE_TENANT_ID_QUERY
            = "UPDATE_USERNAME_WITHOUT_TENANT_DOMAIN_WHERE_TENANT_ID_QUERY";

    private GDPRClientConstants() {

    }
}
