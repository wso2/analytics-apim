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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StateTransitionsTimeBatchStreamProcessor extends StreamProcessor implements SchedulingProcessor {
    /*
     * key - user Inner Map key - consumerKey value - last state
     */
    private Map<String, Map<String, String>> userToLastStates = null;
    private List<StreamEvent> currentEvents = null;
    private long lastScheduledTime = -1;
    private long timeToKeep;
    private Scheduler scheduler;
    private VariableExpressionExecutor[] variableExecutors;

    @Override
    protected List<Attribute> init(AbstractDefinition inputDefinition,
            ExpressionExecutor[] attributeExpressionExecutors, ExecutionPlanContext executionPlanContext) {
        try {
            variableExecutors = new VariableExpressionExecutor[attributeExpressionExecutors.length - 1];
            System.arraycopy(attributeExpressionExecutors, 0, variableExecutors, 0,
                    attributeExpressionExecutors.length - 1);
        } catch (ArrayStoreException ex) {
            throw new ExecutionPlanValidationException(
                    "StateTransitionsTimeBatchStreamProcessor's parameters other than last should be a variable.");
        }

        if (attributeExpressionExecutors[attributeExpressionExecutors.length - 1].getReturnType() == Attribute.Type.INT) {
            timeToKeep = (Integer) ((ConstantExpressionExecutor) attributeExpressionExecutors[attributeExpressionExecutors.length - 1])
                    .getValue();
        } else if (attributeExpressionExecutors[attributeExpressionExecutors.length - 1].getReturnType() == Attribute.Type.LONG) {
            timeToKeep = (Long) ((ConstantExpressionExecutor) attributeExpressionExecutors[attributeExpressionExecutors.length - 1])
                    .getValue();
        } else {
            throw new ExecutionPlanValidationException(
                    "StateTransitionsTimeBatchStreamProcessor's last parameter windowTime should be either int or long, but found "
                            + attributeExpressionExecutors[attributeExpressionExecutors.length - 1].getReturnType());
        }

        this.userToLastStates = new HashMap<String, Map<String, String>>();
        this.currentEvents = new ArrayList<StreamEvent>();

        ArrayList<Attribute> attributes = new ArrayList<Attribute>(1);
        attributes.add(new Attribute("startState", Attribute.Type.STRING));
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

                if (currentEvents.size() >= timeToKeep) {
                    flushToOutputChunk(streamEventCloner, complexEventChunks, executionPlanContext
                            .getTimestampGenerator().currentTime(), true);
                }

                if (currStreamEvent.getType() == ComplexEvent.Type.TIMER) {
                    if (currentEvents.size() > 0) {
                        flushToOutputChunk(streamEventCloner, complexEventChunks, executionPlanContext
                                .getTimestampGenerator().currentTime(), true);
                    }
                    lastScheduledTime = executionPlanContext.getTimestampGenerator().currentTime() + timeToKeep;
                    scheduler.notifyAt(lastScheduledTime);
                    continue;
                } else if (currStreamEvent.getType() != ComplexEvent.Type.CURRENT) {
                    continue;
                }

                String consumerKey = (String) variableExecutors[0].execute(currStreamEvent);
                String userId = (String) variableExecutors[1].execute(currStreamEvent);
                String currentState = (String) variableExecutors[2].execute(currStreamEvent);

                // check the last event state from this user and consumer key
                Map<String, String> lastStates = userToLastStates.get(userId);
                if (lastStates == null) {
                    lastStates = new HashMap<String, String>();
                }

                String lastEventState;
                if ((lastEventState = lastStates.get(consumerKey)) != null) {
                    // last state is available
                    // append to event chunk
                    cloneAppend(streamEventCloner, currStreamEvent, complexEventPopulater, lastEventState);
                }

                // update the last state to current state
                lastStates.put(consumerKey, currentState);
                userToLastStates.put(userId, lastStates);

            }
        }
        for (ComplexEventChunk<StreamEvent> complexEventChunk : complexEventChunks) {
            nextProcessor.process(complexEventChunk);
        }
    }

    private void cloneAppend(StreamEventCloner streamEventCloner, StreamEvent currStreamEvent,
            ComplexEventPopulater complexEventPopulater, String startState) {
        StreamEvent clonedStreamEvent = streamEventCloner.copyStreamEvent(currStreamEvent);
        complexEventPopulater.populateComplexEvent(clonedStreamEvent, new Object[] { startState });
        currentEvents.add(clonedStreamEvent);
    }

    private void flushToOutputChunk(StreamEventCloner streamEventCloner,
            List<ComplexEventChunk<StreamEvent>> complexEventChunks, long currentTime, boolean preserveCurrentEvents) {
        ComplexEventChunk<StreamEvent> newEventChunk = new ComplexEventChunk<StreamEvent>(true);

        for (StreamEvent currentEvent : currentEvents) {
            // add current event to next processor
            newEventChunk.add(currentEvent);
        }
        currentEvents.clear();

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
        return new Object[] { userToLastStates, currentEvents, lastScheduledTime };
    }

    public void restoreState(Object[] state) {
        userToLastStates = (Map<String, Map<String, String>>) state[0];
        currentEvents = (List<StreamEvent>) state[1];
        lastScheduledTime = (Long) state[2];
    }

    @Override
    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    @Override
    public Scheduler getScheduler() {
        return this.scheduler;
    }

}
