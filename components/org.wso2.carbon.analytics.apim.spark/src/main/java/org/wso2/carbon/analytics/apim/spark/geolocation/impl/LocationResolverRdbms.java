/*
*  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.carbon.analytics.apim.spark.geolocation.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.Location;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolver;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.LocationResolverConstants;
import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.apim.spark.geolocation.utils.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class LocationResolverRdbms extends LocationResolver {
    private static final Log log = LogFactory.getLog(LocationResolverRdbms.class);
    private static DBUtil dbUtil;
    private String dataSource;
    private boolean persistInDataBase;
    private int ipToLongCacheCount;
    private static LRUCache<String, Long> ipToLongCache;
    public static final String SQL_SELECT_LOCATION_FROM_IP = "SELECT country_name, city_name FROM " +
            "IP_LOCATION WHERE ip = ?";
    public static final String SQL_INSERT_LOCATION_INTO_TABLE = "INSERT INTO IP_LOCATION (ip,country_name," +
            "city_name) VALUES (?,?,?)";
    public static final String SQL_SELECT_LOCATION_FROM_LONG_VALUE_OF_IP = "SELECT loc.country_name,loc" +
            ".subdivision_1_name FROM BLOCKS block , LOCATION loc WHERE ? " + "BETWEEN " + "block.network AND " +
            "block.broadcast AND block.geoname_id=loc.geoname_id";

    @Override
    public void init() throws GeoLocationResolverException {
        ipToLongCache = new LRUCache<>(ipToLongCacheCount);
        DBUtil.getInstance().setDataSourceName(dataSource);
        try {
            DBUtil.initialize();
        } catch (GeoLocationResolverException e) {
            throw new GeoLocationResolverException("Couldn't init dataSource " + dataSource, e);
        }
    }

    public Location getLocation(String ip) throws GeoLocationResolverException {
        dbUtil = DBUtil.getInstance();
        return getLocationFromIp(ip);
    }


    public LocationResolverRdbms() {

    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public int getIpToLongCacheCount() {
        return ipToLongCacheCount;
    }

    public void setIpToLongCacheCount(int ipToLongCacheCount) {
        this.ipToLongCacheCount = ipToLongCacheCount;
    }

    public boolean isPersistInDataBase() {
        return persistInDataBase;
    }

    public void setPersistInDataBase(boolean persistInDataBase) {
        this.persistInDataBase = persistInDataBase;
    }

    private Location getLocationFromLongValueOfIp(String ipAddress, Connection connection) throws
            GeoLocationResolverException {

        Location location = null;
        PreparedStatement statement = null;
        ResultSet resultSet = null;
        try {
            statement = connection.prepareStatement(SQL_SELECT_LOCATION_FROM_LONG_VALUE_OF_IP);
            statement.setLong(1, getIpV4ToLong(ipAddress));
            resultSet = statement.executeQuery();
            if (resultSet.next()) {
                location = new Location(resultSet.getString("country_name"), resultSet.getString("subdivision_1_name"),
                        ipAddress);
            }
        } catch (SQLException e) {
            throw new GeoLocationResolverException("Error while getting the location from database", e);
        } finally {
            dbUtil.closeAllConnections(statement, null, resultSet);
        }
        return location;
    }

    private Location getLocationFromIp(String ipAddress) throws GeoLocationResolverException {
        Location location = null;
        Connection connection = null;
        PreparedStatement statement = null;
        ResultSet resultSet = null;
        try {
            connection = dbUtil.getConnection();
            if (persistInDataBase) {
                statement = connection.prepareStatement(SQL_SELECT_LOCATION_FROM_IP);
                statement.setString(1, ipAddress);
                resultSet = statement.executeQuery();
            }
            if (resultSet != null && resultSet.next()) {
                location = new Location(resultSet.getString("country_name"), resultSet.getString("city_name"),
                        ipAddress);
            } else {
                location = getLocationFromLongValueOfIp(ipAddress, connection);
                if (location != null) {
                    if (persistInDataBase) {
                        saveLocation(location, connection);
                    }
                }
            }
        } catch (SQLException e) {
            throw new GeoLocationResolverException("Error while getting the location from database", e);
        } finally {
            dbUtil.closeAllConnections(statement, connection, resultSet);
        }
        return location;
    }

    private boolean saveLocation(Location location, Connection connection) throws GeoLocationResolverException {
        PreparedStatement statement = null;
        boolean status;
        try {
            statement = connection.prepareStatement(SQL_INSERT_LOCATION_INTO_TABLE);
            statement.setString(1, location.getIp());
            statement.setString(2, location.getCountry());
            statement.setString(3, location.getCity());
            status = statement.execute();
            connection.commit();
        } catch (SQLException e) {
            throw new GeoLocationResolverException("Error while saving  the location to database", e);
        } finally {
            dbUtil.closeAllConnections(statement, null, null);
        }
        return status;
    }

    private static long getIpV4ToLong(String ipAddress) {

        Long ipToLong = ipToLongCache.get(ipAddress);

        if (ipToLong == null) {
            String[] ipAddressInArray = ipAddress.split("\\.");
            long longValueOfIp = 0;
            int i = 0;
            for (String ipChunk : ipAddressInArray) {
                int power = 3 - i;
                int ip = Integer.parseInt(ipChunk);
                longValueOfIp += ip * Math.pow(256, power);
                i++;
            }
            ipToLongCache.put(ipAddress, longValueOfIp);
            ipToLong = longValueOfIp;
        }
        return ipToLong;
    }
}
