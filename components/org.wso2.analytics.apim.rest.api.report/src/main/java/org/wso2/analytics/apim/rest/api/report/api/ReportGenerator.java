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
package org.wso2.analytics.apim.rest.api.report.api;

import org.apache.pdfbox.exceptions.COSVisitorException;

import java.io.IOException;
import java.io.InputStream;

/**
 *  Report Generator interface. All implementations of report generators need to implement this.
 */
public interface ReportGenerator {

    /**
     * Generates monthly request summary report.
     * @return
     * @throws IOException
     * @throws COSVisitorException
     */
    InputStream generateMonthlyRequestSummaryPDF() throws IOException, COSVisitorException;

}
