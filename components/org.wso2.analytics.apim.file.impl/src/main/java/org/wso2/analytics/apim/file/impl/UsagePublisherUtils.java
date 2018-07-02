/*
 * Copyright (c) 2018 WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.analytics.apim.file.impl;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.wso2.analytics.apim.file.impl.exception.FileBasedAnalyticsException;
import org.wso2.analytics.apim.file.impl.util.FileBasedAnalyticsConstants;
import org.wso2.carbon.utils.CarbonUtils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Util Class for Usage Publishing module
 */
public class UsagePublisherUtils {

    private static volatile Map<String, JSONArray> streamDefinitions = null;

    public static Map<String, JSONArray> getStreamDefinitions() throws FileBasedAnalyticsException {
        if (streamDefinitions == null || streamDefinitions.size() < 6) {
            synchronized (FileDataPublisher.class) {
                if (streamDefinitions == null || streamDefinitions.size() < 6) {
                    String streamDirectoryPath = CarbonUtils.getCarbonConfigDirPath() + File.separator
                            + FileBasedAnalyticsConstants.STREAM_DEFINITIONS_DIRECTORY;
                    Collection<File> files = FileUtils.listFiles(new File(streamDirectoryPath), null, false);
                    if (!(files.size() < 6)) {
                        streamDefinitions = new HashMap<>();
                        for (File file : files) {
                            FileInputStream fileInputStream = null;
                            InputStreamReader inputStreamReader = null;
                            BufferedReader bufferedReader = null;
                            try {
                                fileInputStream = new FileInputStream(file);
                                inputStreamReader = new InputStreamReader(fileInputStream, StandardCharsets.UTF_8);
                                bufferedReader = new BufferedReader(inputStreamReader);
                                String readLine;
                                StringBuilder jsonStr = new StringBuilder();
                                while ((readLine = bufferedReader.readLine()) != null) {
                                    jsonStr.append(readLine);
                                }
                                JSONParser jsonParser = new JSONParser();
                                JSONObject jsonObject = (JSONObject) jsonParser.parse(jsonStr.toString());
                                String key = jsonObject.get("name") + ":"
                                        + jsonObject.get("version");
                                streamDefinitions.put(key, (JSONArray) jsonObject.get("payloadData"));
                            } catch (IOException | ParseException e) {
                                throw new FileBasedAnalyticsException("Error occurred while reading " + file.getName(), e);
                            } finally {
                                IOUtils.closeQuietly(fileInputStream);
                                IOUtils.closeQuietly(inputStreamReader);
                                IOUtils.closeQuietly(bufferedReader);
                            }
                        }
                    } else {
                        throw new FileBasedAnalyticsException("Steam Definitions not found.");
                    }
                }
            }
        }
        return streamDefinitions;

    }

    public static Object createMetaData(String str) throws Exception {
        if (str.isEmpty() || "null".equals(str)) {
            return null;
        }
        return new Object[]{str};
    }

    public static Object[] createPayload(String streamId, String str) throws Exception {
        JSONArray jsonArray = null;
        try {
            jsonArray = getStreamDefinitions().get(streamId);
        } catch (FileBasedAnalyticsException e) {
            //Ignoring this hence usage Publishing will be disabled if there is an error in the initial startup
        }

        if (jsonArray != null) {
            String[] strings = str.split(FileBasedAnalyticsConstants.OBJECT_SEPARATOR);
            Object[] objects = new Object[strings.length];
            for (int i = 0; i < strings.length; i++) {
                JSONObject obj = (JSONObject) jsonArray.get(i);
                objects[i] = getPayloadObject((String) obj.get("type"), strings[i].trim());
            }
            return objects;
        }
        return new Object[0];
    }

    public static Object getPayloadObject(String type, String string) throws Exception {
        if (string == null || string.isEmpty()) {
            return null;
        }
        switch (type) {
            case "STRING":
                return string;
            case "INT":
                return Integer.parseInt(string);
            case "LONG":
                return Long.parseLong(string);
            case "BOOL":
                return Boolean.parseBoolean(string);
            default:
                return string;
        }
    }

    public static String getUploadedFileDirPath(String tenantDomain, String tempDirName) {
        //Temporary directory is used for keeping the uploaded files
        // i.e [APIUsageFileLocation]/api-usage-data/tenantDomain/tvtzC
        String storageLocation = System.getProperty("APIUsageFileLocation");
        return ((storageLocation != null && !storageLocation.isEmpty())
                ? storageLocation : CarbonUtils.getCarbonHome())
                + File.separator + FileBasedAnalyticsConstants.API_USAGE_OUTPUT_DIRECTORY + File.separator
                + tenantDomain + File.separator + tempDirName;
    }
}
