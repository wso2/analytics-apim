/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.extension.siddhi.io.mgwfile.source;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.databridge.commons.StreamDefinition;
import org.wso2.extension.siddhi.io.mgwfile.MGWFileSourceDS;
import org.wso2.extension.siddhi.io.mgwfile.MGWFileSourceRegistrationManager;
import org.wso2.extension.siddhi.io.mgwfile.exception.MGWFileSourceException;
import org.wso2.extension.siddhi.io.mgwfile.task.MGWFileReaderTask;
import org.wso2.extension.siddhi.io.mgwfile.util.FileDataRetrieverUtil;
import org.wso2.extension.siddhi.map.wso2event.source.WSO2SourceMapper;
import org.wso2.siddhi.annotation.Example;
import org.wso2.siddhi.annotation.Extension;
import org.wso2.siddhi.annotation.Parameter;
import org.wso2.siddhi.annotation.util.DataType;
import org.wso2.siddhi.core.config.SiddhiAppContext;
import org.wso2.siddhi.core.exception.ConnectionUnavailableException;
import org.wso2.siddhi.core.stream.input.source.Source;
import org.wso2.siddhi.core.stream.input.source.SourceEventListener;
import org.wso2.siddhi.core.util.config.ConfigReader;
import org.wso2.siddhi.core.util.transport.OptionHolder;

import java.util.Map;
import java.util.Timer;

/**
 * Micro Gateway File Source
 */

@Extension(name = "mgwfile", namespace = "source", description = "Event source to receive WSO2 Microgateway analytics"
        + " data",
        parameters = {
        @Parameter(
                name = "usage.publishing.frequency",
                description = "Time interval to run the data retrieval timer task in milliseconds.",
                type = { DataType.STRING },
                optional = true,
                defaultValue = "300000"),
        @Parameter(name = "usage.cleanup.frequency",
                description = "Time interval to run the data cleanup timer task in milliseconds.",
                type = {
                DataType.STRING },
                optional = true,
                defaultValue = "1800000"),
        @Parameter(name = "file.retention.days",
                description = "Number of days to keep already read microgateway analytics zip files before removal.",
                type = {
                DataType.STRING },
                optional = true,
                defaultValue = "5"),
        @Parameter(name = "usage.publishing.thread.count",
                description = "Number of threads to use for data retrieval when the timer task runs. A single thread "
                        + "will process data from a single file.",
                type = {
                DataType.STRING },
                optional = true,
                defaultValue = "3"), },
        examples = {
                @Example(
                        syntax = "@source(type = 'mgwfile', wso2.stream.id = 'org.wso2.apimgt.statistics.request:3.0.0'"
                                + ", @map(type = 'wso2event'))",
                        description = "All the parameters for microgateway analytics should be passed in as system "
                                + "properties."
                )
        }
)

public class MGWFileSource extends Source {
    private static final Log log = LogFactory.getLog(MGWFileSource.class);
    private SourceEventListener sourceEventListener;
    private OptionHolder optionHolder;
    private String streamId;
    private MGWFileReaderTask fileReaderTask;

    /**
     * The initialization method for {@link Source}, will be called before other methods. It used to validate
     * all configurations and to get initial values.
     * @param sourceEventListener After receiving events, the source should trigger onEvent() of this listener.
     *                            Listener will then pass on the events to the appropriate mappers for processing .
     * @param optionHolder        Option holder containing static configuration related to the {@link Source}
     * @param configReader        ConfigReader is used to read the {@link Source} related system configuration.
     * @param siddhiAppContext    the context of the {@link org.wso2.siddhi.query.api.SiddhiApp} used to get Siddhi
     *                            related utility functions.
     */
    @Override
    public void init(SourceEventListener sourceEventListener, OptionHolder optionHolder,
                     String[] requestedTransportPropertyNames, ConfigReader configReader,
                     SiddhiAppContext siddhiAppContext) {
        this.sourceEventListener = sourceEventListener;
        this.optionHolder = optionHolder;
        streamId = optionHolder.validateAndGetStaticValue("wso2.stream.id", null);
    }

    /**
     * Returns the list of classes which this source can output.
     *
     * @return Array of classes that will be output by the source.
     * Null or empty array if it can produce any type of class.
     */
    @Override
    public Class[] getOutputEventClasses() {
        return new Class[0];
    }

    /**
     * Initially Called to connect to the end point for start retrieving the messages asynchronously .
     *
     * @param connectionCallback Callback to pass the ConnectionUnavailableException in case of connection failure after
     *                           initial successful connection. (can be used when events are receiving asynchronously)
     * @throws ConnectionUnavailableException if it cannot connect to the source backend immediately.
     */
    @Override
    public void connect(ConnectionCallback connectionCallback) throws ConnectionUnavailableException {
        StreamDefinition streamDefinition = ((WSO2SourceMapper) getMapper()).getWSO2StreamDefinition();
        try {
            FileDataRetrieverUtil.addStreamDefinition(streamDefinition, streamId);
            MGWFileSourceRegistrationManager.registerEventConsumer(streamId, sourceEventListener);
            readFileFromDatabase();
        } catch (MGWFileSourceException e) {
            log.error("Error during parsing stream definition for stream " + streamId
                    + " TimerTask will not be scheduled", e);
        }
    }

    private void readFileFromDatabase() {
        fileReaderTask = new MGWFileReaderTask();
        Timer readTimer = new Timer();
        readTimer.schedule(fileReaderTask, 0, Long.parseLong(MGWFileSourceDS.getFileReaderFrequency()));
    }

    /**
     * This method can be called when it is needed to disconnect from the end point.
     */
    @Override
    public void disconnect() {
        MGWFileSourceRegistrationManager.unregisterEventConsumer(streamId);
    }

    /**
     * Called at the end to clean all the resources consumed by the {@link Source}
     */
    @Override
    public void destroy() {
        MGWFileSourceRegistrationManager.unregisterEventConsumer(streamId);
    }

    /**
     * Called to pause event consumption
     */
    @Override
    public void pause() {
        fileReaderTask.setPaused(true);
    }

    /**
     * Called to resume event consumption
     */
    @Override
    public void resume() {
        fileReaderTask.setPaused(false);
    }

    /**
     * Used to collect the serializable state of the processing element, that need to be
     * persisted for the reconstructing the element to the same state on a different point of time
     *
     * @return stateful objects of the processing element as a map
     */
    @Override
    public Map<String, Object> currentState() {
        return null;
    }

    /**
     * Used to restore serialized state of the processing element, for reconstructing
     * the element to the same state as if was on a previous point of time.
     *
     * @param map the stateful objects of the processing element as a map.
     * This map will have the  same keys that is created upon calling currentState() method.
     */
     @Override
     public void restoreState(Map<String, Object> map) {

     }
}

