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

import io.siddhi.annotation.Example;
import io.siddhi.annotation.Extension;
import io.siddhi.annotation.Parameter;
import io.siddhi.annotation.util.DataType;
import io.siddhi.core.config.SiddhiAppContext;
import io.siddhi.core.exception.ConnectionUnavailableException;
import io.siddhi.core.stream.ServiceDeploymentInfo;
import io.siddhi.core.stream.input.source.Source;
import io.siddhi.core.stream.input.source.SourceEventListener;
import io.siddhi.core.util.config.ConfigReader;
import io.siddhi.core.util.snapshot.state.State;
import io.siddhi.core.util.snapshot.state.StateFactory;
import io.siddhi.core.util.transport.OptionHolder;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.databridge.commons.StreamDefinition;
import org.wso2.extension.siddhi.io.mgwfile.MGWFileSourceDS;
import org.wso2.extension.siddhi.io.mgwfile.MGWFileSourceRegistrationManager;
import org.wso2.extension.siddhi.io.mgwfile.exception.MGWFileSourceException;
import org.wso2.extension.siddhi.io.mgwfile.task.MGWFileReaderTask;
import org.wso2.extension.siddhi.io.mgwfile.util.FileDataRetrieverUtil;
import org.wso2.extension.siddhi.map.wso2event.source.WSO2SourceMapper;

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

    @Override
    protected ServiceDeploymentInfo exposeServiceDeploymentInfo() {
        return null;
    }

    /**
     * The initialization method for {@link Source}, will be called before other methods. It used to validate
     * all configurations and to get initial values.
     * @param sourceEventListener After receiving events, the source should trigger onEvent() of this listener.
     *                            Listener will then pass on the events to the appropriate mappers for processing .
     * @param optionHolder        Option holder containing static configuration related to the {@link Source}
     * @param configReader        ConfigReader is used to read the {@link Source} related system configuration.
     * @param siddhiAppContext    the context of the {@link io.siddhi.query.api.SiddhiApp} used to get Siddhi
     *                            related utility functions.
     */
    @Override
    public StateFactory init(SourceEventListener sourceEventListener, OptionHolder optionHolder,
                             String[] requestedTransportPropertyNames, ConfigReader configReader,
                             SiddhiAppContext siddhiAppContext) {
        this.sourceEventListener = sourceEventListener;
        this.optionHolder = optionHolder;
        streamId = optionHolder.validateAndGetStaticValue("wso2.stream.id", null);
        return null;
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
    public void connect(ConnectionCallback connectionCallback, State stat) throws ConnectionUnavailableException {
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
        if (fileReaderTask != null) {
            fileReaderTask.setPaused(true);
        }
    }

    /**
     * Called to resume event consumption
     */
    @Override
    public void resume() {
        if (fileReaderTask != null) {
            fileReaderTask.setPaused(false);
        }
    }
}

