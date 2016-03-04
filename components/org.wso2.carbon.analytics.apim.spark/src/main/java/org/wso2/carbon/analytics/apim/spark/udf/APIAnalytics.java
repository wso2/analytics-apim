/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.carbon.analytics.apim.spark.udf;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import org.wso2.carbon.analytics.spark.core.udf.CarbonUDF;

import org.apache.commons.math3.distribution.NormalDistribution;

public class APIAnalytics implements CarbonUDF{

    /**
     * @param numOfDays
     * @return
     * @throws APIAnalyticsException
     */
    public Long offsetInDays(Integer numOfDays) throws APIAnalyticsException {
        if (numOfDays == null) {
            throw new APIAnalyticsException("Offset days can't be null");
        }

        Calendar calender = Calendar.getInstance();
        calender.add(Calendar.DAY_OF_MONTH, numOfDays);
        return calender.getTimeInMillis();
    }

    /**
     * This method convert a given timeStamp to the respective Date and returns it as a String
     *
     * @param timeStamp
     * @return Date in MM/dd//yyyy format as a String
     * @throws APIAnalyticsException
     */
    public String convertToDate(Long timeStamp) throws APIAnalyticsException {
        if (timeStamp == null) {
            throw new APIAnalyticsException("timeStamp can't be null");
        }
        Calendar calender = Calendar.getInstance();
        calender.setTimeInMillis(timeStamp);

        DateFormat df = new SimpleDateFormat("dd/MM/yyyy");
        String reportDate = df.format(calender.getTime());
        return reportDate;
    }


    /**
     *
     * @param dateString
     * @return
     * @throws APIAnalyticsException
     */
    public Long convertToTimestamp(String dateString) throws APIAnalyticsException {
        if (dateString == null) {
            throw new APIAnalyticsException("dateString can't be null");
        }

        DateFormat format = new SimpleDateFormat("dd/MM/yyyy");
        Date date = null;
        try {
            date = format.parse(dateString);
        } catch (ParseException e) {
            throw new APIAnalyticsException("An error occurred while parsing string: " + dateString);
        }
        return date.getTime();
    }

    /**
     * This method calculates given percentile using mean and standard deviation
     *
     * @param mean
     * @param stdDeviation
     * @param percentile
     * @return
     * @throws APIAnalyticsException
     */
    public Double getpercentileValue(Double mean, Double stdDeviation, Double percentile) throws APIAnalyticsException {
        if (mean == null || stdDeviation == null || percentile == null) {
            throw new APIAnalyticsException("One or more arguments provided for the method is/are null");
        }

        if (percentile < 0 || percentile > 1) {
            throw new APIAnalyticsException("percentile should in 0 < percentile < 1 range");
        }
        double zValue = new NormalDistribution().inverseCumulativeProbability(percentile);
        return mean + zValue * stdDeviation;
    }
}
