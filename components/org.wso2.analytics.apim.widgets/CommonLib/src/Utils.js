/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

function summarizePieData(data=[], nameField, countField) {
    const PIE_CHART_LIMIT = 8;
    // data could be null
    data = (data === null) ? [] : data;
    const pieChartData = data.sort((a, b) => {
        return b[countField] - a[countField];
    });

    if (data.length > PIE_CHART_LIMIT) {
        const otherPieChartData = pieChartData.slice(PIE_CHART_LIMIT, pieChartData.length)
            .reduce((accumulator, currentValue) => {
                return { [nameField]: ['Other'],[countField]: accumulator[countField] + currentValue[countField] };
            }, { [nameField]: ['Other'],[countField]: 0 });

        pieChartData.splice(PIE_CHART_LIMIT, pieChartData.length, otherPieChartData);
    }
    const legendData = pieChartData.map((item) => {
        return { name: item[nameField] };
    });
    return {
        pieChartData,
        legendData
    };
}

export default {
    summarizePieData
}
