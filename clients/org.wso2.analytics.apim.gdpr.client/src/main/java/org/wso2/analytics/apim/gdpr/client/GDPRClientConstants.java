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
    public static final String CONF_FOLDER = "conf";
    public static final String FILE_NAME = "deployment.yaml";
    public static final String HELP_FILE_NAME = "help.md";
    public static final String SUPER_TENANT_DOMAIN = "carbon.super";
    public static final String CMD_OPTION_CONFIG_DIR = "D";
    public static final String CMD_OPTION_CONFIG_USER_NAME = "U";
    public static final String CMD_OPTION_CONFIG_USER_PSEUDONYM = "pu";
    public static final String CMD_OPTION_CONFIG_TENANT_DOMAIN = "T";
    public static final String CMD_OPTION_CONFIG_USER_EMAIL = "E";
    public static final String CMD_OPTION_CONFIG_USER_IP = "I";
    public static final String CMD_OPTION_HELP = "help";
    public static final String CMD_OPTION_ENABLE_SHA256_HASHING = "sha256";
    public static final String COMMAND_NAME = "gdpr-client";
    public static final String TABLE_NAME_PLACEHOLDER = "{{TABLE_NAME}}";
    public static final String COLUMN_NAME_PLACEHOLDER = "{{COLUMN_NAME}}";
    public static final String IP_COLUMN_NAME_PLACEHOLDER = "{{IP_COLUMN_NAME}}";
    public static final String IP_USERNAME_COLUMN_NAME_PLACEHOLDER = "{{IP_USERNAME_COLUMN_NAME}}";
    public static final String CURRENT_VALUE_PLACEHOLDER = "{{CURRENT_VALUE}}";
    public static final String PSEUDONYM_VALUE_PLACEHOLDER = "{{PSEUDONYM_VALUE}}";
    public static final String IP_PSEUDONYM_VALUE_PLACEHOLDER = "{{IP_PSEUDONYM_VALUE}}";
    public static final String CURRENT_IP_VALUE_PLACEHOLDER = "{{CURRENT_IP_VALUE}}";
    public static final String CURRENT_IP_USERNAME_VALUE_PLACEHOLDER = "{{CURRENT_IP_USERNAME_VALUE}}";
    public static final String PRE_REPLACE_TEXT_VALUE_PLACEHOLDER = "{{PRE_REPLACE_TEXT_VALUE}}";
    public static final String POST_REPLACE_TEXT_VALUE_PLACEHOLDER = "{{POST_REPLACE_TEXT_VALUE}}";
    public static final String REPLACE_VALUE_PLACEHOLDER = "{{REPLACE_VALUE}}";
    public static final String TABLE_CHECK_QUERY = "TABLE_CHECK";
    public static final String UPDATE_QUERY = "UPDATE";
    public static final String REPLACE_AND_UPDATE_QUERY = "REPLACE_AND_UPDATE";
    public static final String IP_AND_USERNAME_UPDATE_QUERY = "IP_AND_USERNAME_UPDATE";
    public static final String REPLACE_EMAIL_AND_UPDATE_QUERY = "REPLACE_EMAIL_AND_UPDATE";
    public static final int IP_MAX = 999;
    public static final int IP_MIN = 256;

    /**
     * Enum to define the supported column types.
     */
    public enum ColumnTypes {
        EMAIL, TEXT, IP
    }

    private GDPRClientConstants() {

    }
}
