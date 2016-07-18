/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.carbon.analytics.apim.siddhi.stream.processor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Holds the Markov Matrix
 */
public class MarkovMatrix implements Serializable {
    private static final long serialVersionUID = -6990315134383123885L;
    private static final Log log = LogFactory.getLog(MarkovMatrix.class);
    Map<String, Double> transitionProbabilities;
    Map<String, Long> transitionCount;
    Map<String, Long> startStateCount;
    boolean isUpdated = false;

    public MarkovMatrix() {
        transitionProbabilities = new HashMap<String, Double>();
        transitionCount = new HashMap<String, Long>();
        startStateCount = new HashMap<String, Long>();
    }

    public void updateStartStateCount(String startState, long increment) {
        Long currentCount = startStateCount.get(startState);
        if (currentCount == null) {
            startStateCount.put(startState, increment);
        } else {
            startStateCount.put(startState, currentCount + increment);
        }
        if (log.isDebugEnabled()) {
            log.debug(String.format("updateStartStateCount: start state: %s count: %s", startState,
                    startStateCount.get(startState)));
        }
    }

    public void update(String startState, String endState, long count) {
        String key = getKey(startState, endState);
        // update transitionCount
        Long currentTransitionCount = transitionCount.get(key);
        if (currentTransitionCount == null) {
            transitionCount.put(key, count);
        } else {
            transitionCount.put(key, count = currentTransitionCount + count);
        }

        // update transitionProbabilities
        double probability = count * 1.0 / startStateCount.get(startState);
        transitionProbabilities.put(key, probability);
        isUpdated = true;
        if (log.isDebugEnabled()) {
            log.debug(String.format("update: start state: %s end state: %s count: %s total count: %s probability: %s",
                    startState, endState, count, startStateCount.get(startState), probability));
        }
    }

    public List<Object[]> getMatrix(String key) {
        List<Object[]> rows = new ArrayList<Object[]>();

        for (Map.Entry<String, Double> entry : transitionProbabilities.entrySet()) {
            Object[] data = new Object[4];
            data[0] = key;
            data[1] = entry.getKey().split(",")[0];
            data[2] = entry.getKey().split(",")[1];
            data[3] = entry.getValue();
            rows.add(data);
        }
        isUpdated = false;
        return rows;
    }

    private String getKey(String startState, String endState) {
        return startState + "," + endState;
    }
}
