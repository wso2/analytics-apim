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

package org.wso2.carbon.analytics.apim.siddhi.stream.processor;

import org.wso2.siddhi.core.config.ExecutionPlanContext;
import org.wso2.siddhi.core.event.ComplexEvent;
import org.wso2.siddhi.core.event.ComplexEventChunk;
import org.wso2.siddhi.core.event.stream.StreamEvent;
import org.wso2.siddhi.core.event.stream.StreamEventCloner;
import org.wso2.siddhi.core.event.stream.populater.ComplexEventPopulater;
import org.wso2.siddhi.core.executor.ConstantExpressionExecutor;
import org.wso2.siddhi.core.executor.ExpressionExecutor;
import org.wso2.siddhi.core.executor.VariableExpressionExecutor;
import org.wso2.siddhi.core.query.processor.Processor;
import org.wso2.siddhi.core.query.processor.SchedulingProcessor;
import org.wso2.siddhi.core.query.processor.stream.StreamProcessor;
import org.wso2.siddhi.core.util.Scheduler;
import org.wso2.siddhi.query.api.definition.AbstractDefinition;
import org.wso2.siddhi.query.api.definition.Attribute;
import org.wso2.siddhi.query.api.exception.ExecutionPlanValidationException;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

public class MarkovChainMatrixTimeBatchStreamProcessor extends StreamProcessor implements SchedulingProcessor {
    /*
     * key - user Inner Map key - consumerKey value - last state
     */
    private Map<String, Map<String, String>> userToLastStates = null;
    private Map<String, MarkovMatrix> consumerKeyToMarkovMatrix = null;
    private long lastScheduledTime = -1;
    private boolean newEventsArrived = false;

    private long timeToKeep;
    private Scheduler scheduler;
    private VariableExpressionExecutor consumerKeyExpressionExecutor;
    private VariableExpressionExecutor userIdExpressionExecutor;
    private VariableExpressionExecutor stateExpressionExecutor;

    @Override
    protected List<Attribute> init(AbstractDefinition inputDefinition,
            ExpressionExecutor[] attributeExpressionExecutors, ExecutionPlanContext executionPlanContext) {
        if (attributeExpressionExecutors.length == 4) {

            if (!(attributeExpressionExecutors[0] instanceof VariableExpressionExecutor)) {
                throw new ExecutionPlanValidationException(
                        "MarkovChainMatrixTimeBatchStreamProcessor's 1st parameter consumerKey should be a variable, but found "
                                + attributeExpressionExecutors[0].getClass());
            }
            consumerKeyExpressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[0];

            if (!(attributeExpressionExecutors[1] instanceof VariableExpressionExecutor)) {
                throw new ExecutionPlanValidationException(
                        "MarkovChainMatrixTimeBatchStreamProcessor's 2nd parameter userId should be a variable, but found "
                                + attributeExpressionExecutors[1].getClass());
            }
            userIdExpressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[1];

            if (!(attributeExpressionExecutors[2] instanceof VariableExpressionExecutor)) {
                throw new ExecutionPlanValidationException(
                        "MarkovChainMatrixTimeBatchStreamProcessor's 3rd parameter state should be a variable, but found "
                                + attributeExpressionExecutors[2].getClass());
            }
            stateExpressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[2];

            if (attributeExpressionExecutors[3].getReturnType() == Attribute.Type.INT) {
                timeToKeep = (Integer) ((ConstantExpressionExecutor) attributeExpressionExecutors[3]).getValue();
            } else if (attributeExpressionExecutors[3].getReturnType() == Attribute.Type.LONG) {
                timeToKeep = (Long) ((ConstantExpressionExecutor) attributeExpressionExecutors[3]).getValue();
            } else {
                throw new ExecutionPlanValidationException(
                        "MarkovChainMatrixTimeBatchStreamProcessor's 4th parameter windowTime should be either int or long, but found "
                                + attributeExpressionExecutors[3].getReturnType());
            }

        } else {
            throw new ExecutionPlanValidationException(
                    "MarkovChainMatrixTimeBatchStreamProcessor should only have four parameters (<variable> consumerKey, <variable> userId, <variable> state, <int|long|time> windowTime), but found "
                            + attributeExpressionExecutors.length + " input attributes");
        }

        this.consumerKeyToMarkovMatrix = new HashMap<String, MarkovChainMatrixTimeBatchStreamProcessor.MarkovMatrix>();
        this.userToLastStates = new HashMap<String, Map<String, String>>();

        ArrayList<Attribute> attributes = new ArrayList<Attribute>(4);
        attributes.add(new Attribute("appConsumerKey", Attribute.Type.STRING));
        attributes.add(new Attribute("startState", Attribute.Type.STRING));
        attributes.add(new Attribute("endState", Attribute.Type.STRING));
        attributes.add(new Attribute("probability", Attribute.Type.DOUBLE));
        return attributes;
    }

    @Override
    protected void process(ComplexEventChunk<StreamEvent> streamEventChunk, Processor nextProcessor,
            StreamEventCloner streamEventCloner, ComplexEventPopulater complexEventPopulater) {

        // event incoming trigger process. No events means no action
        if (streamEventChunk.getFirst() == null) {
            return;
        }

        List<ComplexEventChunk<StreamEvent>> complexEventChunks = new ArrayList<ComplexEventChunk<StreamEvent>>();
        synchronized (this) {
            if (lastScheduledTime < 0) {
                scheduler.notifyAt(lastScheduledTime = executionPlanContext.getTimestampGenerator().currentTime()
                        + timeToKeep);
            }

            StreamEvent nextStreamEvent = streamEventChunk.getFirst();
            while (nextStreamEvent != null) {

                StreamEvent currStreamEvent = nextStreamEvent;
                nextStreamEvent = nextStreamEvent.getNext();

                if (currStreamEvent.getType() == ComplexEvent.Type.TIMER) {
                    if (newEventsArrived) {
                        flushToOutputChunk(streamEventCloner, complexEventChunks, executionPlanContext
                                .getTimestampGenerator().currentTime(), true);
                        newEventsArrived = false;
                        if (log.isDebugEnabled()) {
                            log.debug("MarkovChainMatrixTimeBatchStreamProcessor#timer ran; data added current size: "
                                    + complexEventChunks.size());
                        }
                    }
                    lastScheduledTime = executionPlanContext.getTimestampGenerator().currentTime() + timeToKeep;
                    scheduler.notifyAt(lastScheduledTime);
                    continue;
                } else if (currStreamEvent.getType() != ComplexEvent.Type.CURRENT) {
                    continue;
                }

                String consumerKey = (String) consumerKeyExpressionExecutor.execute(currStreamEvent);
                String userId = (String) userIdExpressionExecutor.execute(currStreamEvent);
                String currentState = (String) stateExpressionExecutor.execute(currStreamEvent);

                // check the last event state from this user and consumer key
                Map<String, String> lastStates = userToLastStates.get(userId);
                if (lastStates == null) {
                    lastStates = new HashMap<String, String>();
                }

                String lastState;
                if ((lastState = lastStates.get(consumerKey)) != null) {
                    // last state is available
                    // update the matrix
                    MarkovMatrix matrix = consumerKeyToMarkovMatrix.get(consumerKey);
                    if (matrix == null) {
                        matrix = new MarkovMatrix();
                    }
                    matrix.updateStartStateCount(lastState, 1);
                    matrix.update(lastState, currentState, 1);
                    consumerKeyToMarkovMatrix.put(consumerKey, matrix);
                }

                // update the last state to current state
                lastStates.put(consumerKey, currentState);
                userToLastStates.put(userId, lastStates);

                newEventsArrived = true;

            }
        }
        for (ComplexEventChunk<StreamEvent> complexEventChunk : complexEventChunks) {
            nextProcessor.process(complexEventChunk);
        }
    }

    private void flushToOutputChunk(StreamEventCloner streamEventCloner,
            List<ComplexEventChunk<StreamEvent>> complexEventChunks, long currentTime, boolean preserveCurrentEvents) {
        ComplexEventChunk<StreamEvent> newEventChunk = new ComplexEventChunk<StreamEvent>(true);

        for (Entry<String, MarkovMatrix> entry : consumerKeyToMarkovMatrix.entrySet()) {
            if (!entry.getValue().isUpdated) {
                continue;
            }
            List<Object[]> matrices = entry.getValue().getMatrix(entry.getKey());
            for (Object[] data : matrices) {
                StreamEvent event = new StreamEvent(0, 0, 4);
                event.setOutputData(data);
                event.setTimestamp(currentTime);
                newEventChunk.add(event);
            }
        }

        if (newEventChunk.getFirst() != null) {
            complexEventChunks.add(newEventChunk);
        }
    }

    public void start() {
        // Do nothing
    }

    public void stop() {
        // Do nothing
    }

    public Object[] currentState() {
        return new Object[] { userToLastStates, consumerKeyToMarkovMatrix, lastScheduledTime, newEventsArrived };
    }

    public void restoreState(Object[] state) {
        userToLastStates = (Map<String, Map<String, String>>) state[0];
        consumerKeyToMarkovMatrix = (Map<String, MarkovMatrix>) state[1];
        lastScheduledTime = (Long) state[3];
        newEventsArrived = (Boolean) state[4];
    }

    @Override
    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    @Override
    public Scheduler getScheduler() {
        return this.scheduler;
    }

    /**
     * Holds the Markov Matrix
     */
    class MarkovMatrix implements Serializable {
        private static final long serialVersionUID = -6990315134383123885L;
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
                log.debug(String.format(
                        "update: start state: %s end state: %s count: %s total count: %s probability: %s", startState,
                        endState, count, startStateCount.get(startState), probability));
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
}
