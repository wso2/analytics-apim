/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.rest.api.report.reportgen.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a table with data.
 */
public class TableData {
    private String[] columnHeaders;
    private List<RowEntry> rows = new ArrayList<RowEntry>();

    public List<RowEntry> getRows() {
        return rows;
    }

    public void setRows(List<RowEntry> rows) {
        this.rows = rows;
    }

    public void setRow(RowEntry rowEntry) {
        this.rows.add(rowEntry);
    }

    public String[] getColumnHeaders() {

        if (columnHeaders != null) {
            return columnHeaders.clone();
        } else {
            return new String[0];
        }
    }

    public void setColumnHeaders(String[] columnHeaders) {

        this.columnHeaders = columnHeaders.clone();
    }

}
