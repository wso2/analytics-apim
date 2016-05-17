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

import org.testng.Assert;
import org.testng.annotations.Test;

public class APIManagerAnalyticsUDFTest {

	/**
	 * This method tests time-stamp to date conversion
	 */
	@Test
	public void testConvertToDate() {
		String actualDateStr = "24/12/2010";
		long timestamp = 1293148800000L;
		APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
		try {
			String calculatedDateStr = apimUDF.convertToDate(timestamp);
			Assert.assertEquals(calculatedDateStr, actualDateStr);

		} catch (Exception e) {
			Assert.assertEquals(e instanceof APIManagerAnalyticsUDFException, true);
		}
	}

    @Test(expectedExceptions = APIManagerAnalyticsUDFException.class)
    public void testConvertToDateException() throws APIManagerAnalyticsUDFException {
        APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
        String calculatedDateStr = apimUDF.convertToDate(null);
    }

	/**
	 * This method tests data to time-stamp conversion
	 */
	@Test
	public void testConvertToTimestamp() {
		String date = "12/12/2010";
		long actualTimeStamp = 1292112000000L;
		APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
		try {
			long calculatedTimestamp = apimUDF.convertToTimestamp(date);
			Assert.assertEquals(calculatedTimestamp, actualTimeStamp);

		} catch (Exception e) {
			Assert.assertEquals(e instanceof APIManagerAnalyticsUDFException, true);
		}

	}

    @Test(expectedExceptions = APIManagerAnalyticsUDFException.class)
    public void testConvertToTimestampException() throws  APIManagerAnalyticsUDFException{
        APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
        long calculatedTimestamp = apimUDF.convertToTimestamp(null);

    }

	/**
	 * This method tests percentile values
	 */
	@Test
	public void testGetpercentileValue() {
		APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
		Double mean = 5.0;
		Double stdDev = 0.0;
		Double percentile = 0.95;
		double epsilon = 0.0001;
		try {
			double percentileValue = apimUDF.getpercentileValue(mean, stdDev, percentile);
			Assert.assertTrue(Math.abs((percentileValue - 5.0)) < epsilon);
		} catch (Exception e) {
			Assert.assertEquals(e instanceof APIManagerAnalyticsUDFException, true);
		}

	}

    @Test(expectedExceptions = APIManagerAnalyticsUDFException.class)
    public void testGetpercentileValueException() throws APIManagerAnalyticsUDFException {
        APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
        Double mean = 5.0;
        Double stdDev = 0.0;
        double percentileValue = apimUDF.getpercentileValue(mean, stdDev, null);
    }

    @Test(expectedExceptions = APIManagerAnalyticsUDFException.class)
    public void testGetpercentileValueInvalidPercentile() throws APIManagerAnalyticsUDFException {
        APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
        Double mean = 5.0;
        Double stdDev = 0.0;
        Double percentile = 2.5;
        double percentileValue = apimUDF.getpercentileValue(mean, stdDev, percentile);
    }

	/**
	 * This method tests number of offset in days (fast and future offsets)
	 */
	@Test
	public void testOffsetInDays() {
		APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
		long millisecondsInDay = 86400000L;

		try {
			long onePlusOffset = apimUDF.offsetInDays(1);
			long calculatedPlus = millisecondsInDay + System.currentTimeMillis();
			Assert.assertTrue(Math.abs(onePlusOffset - calculatedPlus) < 500);

			long oneMinusOffset = apimUDF.offsetInDays(-1);
			long calculatedMinus = System.currentTimeMillis() - millisecondsInDay;
			Assert.assertTrue(Math.abs((oneMinusOffset - calculatedMinus)) < 500);

		} catch (Exception e) {
			Assert.assertEquals(e instanceof APIManagerAnalyticsUDFException, true);
		}

	}

    @Test(expectedExceptions = APIManagerAnalyticsUDFException.class)
    public void testOffsetInDaysException() throws APIManagerAnalyticsUDFException {
        APIManagerAnalyticsUDF apimUDF = new APIManagerAnalyticsUDF();
        long onePlusOffset = apimUDF.offsetInDays(null);
    }
}
