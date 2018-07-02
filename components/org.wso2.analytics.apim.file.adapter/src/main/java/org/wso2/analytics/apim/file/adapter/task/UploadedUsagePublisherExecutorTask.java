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

package org.wso2.analytics.apim.file.adapter.task;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.analytics.apim.file.adapter.FileDataRetriever;
import org.wso2.analytics.apim.file.adapter.FileDataRetrieverThreadFactory;
import org.wso2.analytics.apim.file.adapter.dao.FIleEventAdapterDAO;
import org.wso2.analytics.apim.file.adapter.dto.UploadedFileInfoDTO;
import org.wso2.analytics.apim.file.adapter.exception.FileBasedAnalyticsException;
import org.wso2.analytics.apim.file.adapter.util.FileEventAdapterConstants;

import java.util.List;
import java.util.TimerTask;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Task for scheduling the usage publishing threads
 */
public class UploadedUsagePublisherExecutorTask extends TimerTask {

    private static final Log log = LogFactory.getLog(
            UploadedUsagePublisherExecutorTask.class);

    private boolean initialized = false;
    private static int workerThreadCount = getWorkerThreadCount();
    private static Executor usagePublisherPool = Executors
            .newFixedThreadPool(workerThreadCount, new FileDataRetrieverThreadFactory());
    private String tenantDomain;
    private int tenantId;

    public UploadedUsagePublisherExecutorTask(String tenantDomain, int tenantId) {
        log.debug("Initializing Uploaded Usage Publisher Executor Task");
        this.tenantDomain = tenantDomain;
        this.tenantId = tenantId;
        this.initialized = true;
    }

    /**
     * Returns the number of workers allowed for the server.
     *
     * @return int number of worker threads
     */
    private static int getWorkerThreadCount() {

        int threadCount = FileEventAdapterConstants.DEFAULT_WORKER_THREAD_COUNT;
        String workerThreadCountSystemPropertyValue = System
                .getProperty(FileEventAdapterConstants.WORKER_THREAD_COUNT_PROPERTY);
        if (StringUtils.isNotEmpty(workerThreadCountSystemPropertyValue)) {
            try {
                threadCount = Integer.parseInt(workerThreadCountSystemPropertyValue);
            } catch (NumberFormatException e) {
                log.error("Error while parsing the system property: "
                        + FileEventAdapterConstants.WORKER_THREAD_COUNT_PROPERTY
                        + " to integer. Using default usage publish worker thread count: "
                        + FileEventAdapterConstants.DEFAULT_WORKER_THREAD_COUNT, e);
            }
        }
        return threadCount;
    }

    @Override
    public void run() {
        if (initialized) {
            try {
                List<UploadedFileInfoDTO> uploadedFileList = FIleEventAdapterDAO
                        .getNextFilesToProcess(workerThreadCount);
                for (UploadedFileInfoDTO dto : uploadedFileList) {
                    //if (log.isDebugEnabled()) {
                    log.info("Scheduled publishing On-Premise API Usage data for : " + dto.getKey());
                    //}
                    Runnable worker = new FileDataRetriever(dto, tenantDomain, tenantId);
                    usagePublisherPool.execute(worker);
                }
            } catch (FileBasedAnalyticsException e) {
                log.error("Error occurred while publishing On-Premise API Usage data.", e);
            }
        } else {
            log.warn("Uploaded Usage Publishing is disabled.");
        }
    }

}
