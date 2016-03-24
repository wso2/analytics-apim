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
package org.wso2.analytics.apim.integration.common.utils;

import org.wso2.carbon.event.simulator.stub.types.EventDto;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class CSVSimulatorUtil {

    /**
     * Returns a list of events read from a csv file.
     * @param file: file name of the csv file.
     * @return a list of events.
     * @throws IOException
     */
    public static List<EventDto> getEventListFromCSV(String file, String streamId) throws IOException {
        String line = "";
        String cvsSplitBy = ",";

        List<EventDto> eventDtoList = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            while ((line = br.readLine()) != null) {
                // use comma as separator
                EventDto tempEvent = new EventDto();
                tempEvent.setEventStreamId(streamId);
                String[] eventArray = line.split(cvsSplitBy);
                tempEvent.setAttributeValues(eventArray);
                eventDtoList.add(tempEvent);
            }
        } catch (Exception e) {
            throw e;
        }
        return eventDtoList;
    }
}
