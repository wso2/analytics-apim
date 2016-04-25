<datasources-configuration xmlns:svns="http://org.wso2.securevault/configuration">
    <datasources>
        <datasource>
            <name>GEO_LOCATION_DATA</name>
            <description>The datasource used for Geo location database</description>
            <jndiConfig>
                <name>jdbc/GEO_LOCATION_DATA</name>
            </jndiConfig>
            <definition type="RDBMS">
                <configuration>
                    <url>jdbc:h2:repository/database/GEOLOCATION_DB;DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=60000;WRITE_DELAY=0</url>
                    <username>wso2carbon</username>
                    <password>wso2carbon</password>
                    <driverClassName>org.h2.Driver</driverClassName>
                    <maxActive>50</maxActive>
                    <maxWait>60000</maxWait>
                    <testOnBorrow>true</testOnBorrow>
                    <validationQuery>SELECT 1</validationQuery>
                    <validationInterval>30000</validationInterval>
                    <defaultAutoCommit>false</defaultAutoCommit>
                </configuration>
            </definition>
        </datasource>
    </datasources>
</datasources-configuration>