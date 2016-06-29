
/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.wso2.analytics.apim.integration.tests.apim.analytics.utils;

import java.io.File;

public class APIMAnalyticsIntegrationTestConstants {

    public static final String RELATIVE_PATH_TO_TEST_ARTIFACTS = "analytics" + File.separator + "apim" +
            File.separator + "artifacts" + File.separator;
    public static final int TCP_PORT = 8461;

    //constants related to RequestPatternChange Tests
    public static final String REQUEST_COUNT_TABLE = "ORG_WSO2_ANALYTICS_APIM_REQUESTCOUNTTABLE";
    public static final String FIRST_COUNT_TABLE = "ORG_WSO2_ANALYTICS_APIM_FIRSTCOUNTTABLE";
    public static final String MARKOV_MODEL_TABLE = "ORG_WSO2_ANALYTICS_APIM_MARKOVMODELTABLE";
    
    // abnormal tier usage tables
    public static final String REQUEST_TABLE = "ORG_WSO2_APIMGT_STATISTICS_PERMINUTEREQUEST";	
    public static final String REQUEST_PER_X_DAYS_TABLE = "ORG_WSO2_API_AVG_REQ_X_DAYS";
    public static final String PERCENTILE_TABEL = "ORG_WSO2_API_PERCENTILE";
    public static final String ALERT_STORE_TABLE = "ORG_WSO2_API_ALERT_STORE";
    public static final String ABNORMAL_REQ_ALERT_TABLE = "ORG_WSO2_API_ABN_REQ_ALERT";
    public static final String ALL_ALERT_TABLE = "ORG_WSO2_API_ALL_ALERT";
    public static final String ADITIONAL_DATA = "ORG_WSO2_API_ABNORMAL_ADITIONAL_DATA";

    public static final String REST_CAPP_PATH = "statistics";
    
    
    

}
