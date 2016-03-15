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
package org.wso2.carbon.analytics.apim.spark.geolocation.utils;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.apim.spark.geolocation.api.Location;
import org.wso2.carbon.analytics.apim.spark.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.apim.spark.geolocation.holders.CacheHolder;
import org.wso2.carbon.analytics.apim.spark.geolocation.impl.LRUCache;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import java.sql.*;

public class DBUtil {
    private static final DBUtil dbUtil = new DBUtil();
    private static volatile DataSource dataSource = null;
    private static String dataSourceName;
    private static final Log log = LogFactory.getLog(DBUtil.class);

    private DBUtil() {
    }

    public static DBUtil getInstance() {
        return dbUtil;
    }

    public static void initialize() throws GeoLocationResolverException {
        if (dataSource != null) {
            return;
        }

        synchronized (DBUtil.class) {
            if (dataSource == null) {
                try {
                    Context ctx = new InitialContext();
                    dataSource = (DataSource) ctx.lookup(dataSourceName);
                } catch (NamingException e) {
                    String msg = "Couldn't find JDBC Data Source from Data source name" + dataSourceName;
                    throw new GeoLocationResolverException(msg, e);
                }
            }
        }
    }

    /**
     * Utility method to get a new database connection
     *
     * @return Connection
     * @throws SQLException if failed to get Connection
     */
    public Connection getConnection() throws SQLException {
        if (dataSource != null) {
            return dataSource.getConnection();
        }
        throw new SQLException("Data source is not configured properly.");
    }

    /**
     * Utility method to close the connection streams.
     *
     * @param preparedStatement PreparedStatement
     * @param connection        Connection
     * @param resultSet         ResultSet
     */
    public void closeAllConnections(PreparedStatement preparedStatement, Connection connection,
                                    ResultSet resultSet) {
        closeConnection(connection);
        closeResultSet(resultSet);
        closeStatement(preparedStatement);
    }

    /**
     * Close Connection
     *
     * @param dbConnection Connection
     */
    private void closeConnection(Connection dbConnection) {
        if (dbConnection != null) {
            try {
                dbConnection.close();
            } catch (SQLException e) {
                log.error("Couldn't close connection", e);
            }
        }
    }

    /**
     * Close ResultSet
     *
     * @param resultSet ResultSet
     */
    private void closeResultSet(ResultSet resultSet) {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                log.error("Couldn't close ResultSet", e);
            }
        }

    }

    /**
     * Close PreparedStatement
     *
     * @param preparedStatement PreparedStatement
     */
    public void closeStatement(Statement preparedStatement) {
        if (preparedStatement != null) {
            try {
                preparedStatement.close();
            } catch (SQLException e) {
                log.error("Couldn't close Statement", e);
            }
        }

    }

    private Location getLocation(String ipAddress, Connection connection) throws GeoLocationResolverException {
        String sql = "SELECT loc.country_name,loc.subdivision_1_name FROM blocks AS block , location AS loc WHERE ? " +
                "BETWEEN " +
                "block.network AND block.broadcast AND block.geoname_id=loc.geoname_id";
        Location location = null;
        PreparedStatement statement = null;
        ResultSet resultSet = null;
        try {
            statement = connection.prepareStatement(sql);
            statement.setLong(1, getIpV4ToLong(ipAddress));
            resultSet = statement.executeQuery();
            if (resultSet.next()) {
                location = new Location(resultSet.getString("country_name"), resultSet.getString("city_name"),
                        ipAddress);
            }
        } catch (SQLException e) {
            throw new GeoLocationResolverException(e.getMessage(), e);
        } finally {
            closeAllConnections(statement, null, resultSet);
        }
        return location;
    }

    public Location getLocation(String ipAddress) throws GeoLocationResolverException {
        String sql = "SELECT location.country_name,location.city_name FROM IP_LOCATION AS location WHERE location.ip " +
                "= ?";
        Location location = null;
        Connection connection = null;
        PreparedStatement statement = null;
        ResultSet resultSet = null;
        try {
            initialize();
            connection = getConnection();
            statement = connection.prepareStatement(sql);
            statement.setString(1, ipAddress);
            resultSet = statement.executeQuery();
            if (resultSet.next()) {
                location = new Location(resultSet.getString("country_name"), resultSet.getString("city_name"),
                        ipAddress);
            } else {
                location = getLocation(ipAddress, connection);
                if (location != null) {
                    saveLocation(location, connection);
                }
            }

        } catch (SQLException e) {
            throw new GeoLocationResolverException(e.getMessage(), e);
        } finally {
            closeAllConnections(statement, connection, resultSet);
        }
        return location;
    }

    private boolean saveLocation(Location location, Connection connection) throws GeoLocationResolverException {
        String sql = "INSERT INTO IP_LOCATION (ip,country_name,city_name) VALUES (?,?,?)";
        PreparedStatement statement = null;
        boolean status;
        try {
            statement = connection.prepareStatement(sql);
            statement.setString(1, location.getIp());
            statement.setString(2, location.getCountry());
            statement.setString(3, location.getCity());
            status = statement.execute();
            connection.commit();
        } catch (SQLException e) {
            throw new GeoLocationResolverException(e.getMessage(), e);
        } finally {
            closeAllConnections(statement, null, null);
        }
        return status;
    }


    public void setDataSourceName(String dataSourceName) {
        DBUtil.dataSourceName = dataSourceName;
    }

    private static long getIpV4ToLong(String ipAddress) {
        LRUCache<String, Long> cache = CacheHolder.getInstance().getIpToLongCache();

        Long ipToLong = cache.get(ipAddress);
        if (ipToLong == null) {
            String[] ipAddressInArray = ipAddress.split("\\.");
            long result = 0;
            int i = 0;
            for (String ipChunk : ipAddressInArray) {
                int power = 3 - i;
                int ip = Integer.parseInt(ipChunk);
                result += ip * Math.pow(256, power);
                i++;
            }
            cache.put(ipAddress, result);
            ipToLong = result;
        }
        return ipToLong;
    }
}
