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

package org.wso2.analytics.apim.file.adapter.util;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.wso2.analytics.apim.file.adapter.exception.FileBasedAnalyticsException;
import org.wso2.analytics.apim.file.adapter.internal.ds.FileEventAdapterServiceValueHolder;
import org.wso2.carbon.databridge.commons.StreamDefinition;
import org.wso2.carbon.event.stream.core.EventStreamService;
import org.wso2.carbon.event.stream.core.exception.EventStreamConfigurationException;

import java.util.HashMap;
import java.util.Map;

/**
 * Util Class for FileDataRetriever
 */
public class FileDataRetrieverUtil {

    private static volatile Map<String, JSONArray> streamDefinitions = null;

    private static String[] getStreamIdList() {
        String[] streamIdList = new String[5];
        streamIdList[0] = FileEventAdapterConstants.REQUEST_STREAM_ID;
        streamIdList[1] = FileEventAdapterConstants.RESPONSE_STREAM_ID;
        streamIdList[2] = FileEventAdapterConstants.EXECUTION_STREAM_ID;
        streamIdList[3] = FileEventAdapterConstants.FAULT_STREAM_ID;
        streamIdList[4] = FileEventAdapterConstants.THROTTLE_STREAM_ID;
        return streamIdList;
    }

    public static Map<String, JSONArray> getStreamDefinitions() throws FileBasedAnalyticsException {
        streamDefinitions = new HashMap<>();
        EventStreamService eventStreamService = FileEventAdapterServiceValueHolder.getEventStreamService();
        try {
            String[] StreamIds = getStreamIdList();
            for(String streamId: StreamIds) {
                StreamDefinition streamDefinition = eventStreamService.getStreamDefinition(streamId);
                String jsonStr = streamDefinition.toString();
                JSONParser jsonParser = new JSONParser();
                JSONObject jsonObject = (JSONObject) jsonParser.parse(jsonStr.toString());
                String key = jsonObject.get("name") + ":"
                        + jsonObject.get("version");
                streamDefinitions.put(key, (JSONArray) jsonObject.get("payloadData"));
            }
        } catch (EventStreamConfigurationException | ParseException e) {
           throw new FileBasedAnalyticsException("error");
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
            String[] strings = str.split(FileEventAdapterConstants.OBJECT_SEPARATOR);
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

}
