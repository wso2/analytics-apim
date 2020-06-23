/* eslint-disable require-jsdoc */
/* eslint-disable react/prefer-stateless-function */
/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import cloneDeep from 'lodash/cloneDeep';
import CustomFormGroup from './CustomFormGroup';
import TrafficChart from './TrafficChart';

/**
 * React Component for Total Api Traffic widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Total Api Traffic widget body
 */
export default class APIMTotalApiTraffic extends Component {
    /**
     * @param {*} props
     */
    constructor(props) {
        super(props);
        this.state = {
            selectedAPI: undefined,
            selectedVersion: undefined,
            selectedResource: undefined,
            selectedLimit: 5,
            apiList: [],
            versionList: [],
            operationList: [],
        };
        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
    }

    handleAPIChange(event) {
        this.setState({ selectedAPI: event.target.value }, this.loadingDrillDownData);
        this.loadVersions(event.target.value);
    }

    handleVersionChange(event) {
        this.setState({ selectedVersion: event.target.value }, this.loadingDrillDownData);
        const { versionList } = this.state;
        const api = versionList[event.target.value];
        this.loadOperations(api[0]);
    }

    handleOperationChange(event) {
        this.setState({ selectedResource: event.target.value }, this.loadingDrillDownData);
    }

    handleLimitChange(event) {
        this.setState({ selectedLimit: event.target.value }, this.loadingDrillDownData);
    }

    // start of filter loading
    loadApis() {
        this.loadingDrillDownData();

        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listApisQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadApis', widgetName, this.handleLoadApis, dataProviderConfigs);
    }

    loadVersions(selectedAPI) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listVersionsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedAPI}}': selectedAPI,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadVersions', widgetName, this.handleLoadVersions, dataProviderConfigs);
    }

    loadOperations(selectedVersion) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedVersion}}': selectedVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadOperations', widgetName, this.handleLoadOperations, dataProviderConfigs);
    }

    handleLoadApis(message) {
        const { data } = message;
        this.setState({ apiList: data });
    }

    handleLoadVersions(message) {
        const { data } = message;
        this.setState({ versionList: data });
    }

    handleLoadOperations(message) {
        const { data } = message;
        this.setState({ operationList: data });
    }
    // end of filter loading


    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Total Api Traffic widget
     * @memberof APIMTotalApiTraffic
     */
    render() {
        const {
            themeName, usageData, handleLimitChange, limit, height, inProgress, setCurrentApi,
        } = this.props;
        const styles = {
            headingWrapper: {
                margin: 'auto',
                width: '95%',
            },
            paperWrapper: {
                height: '75%',
                width: '95%',
                margin: 'auto',
            },
            paper: {
                background: themeName === 'dark' ? '#152638' : '#E8E8E8',
                marginTop: 10,
                padding: '4%',
            },
            inProgress: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height,
            },
            formControl: {
                marginTop: '2%',
                marginLeft: '5%',
            },
            mainDiv: {
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                height,
                padding: 30,
            },
            h3: {
                margin: 'auto',
                textAlign: 'center',
                fontWeight: 'normal',
                letterSpacing: 1.5,
                paddingBottom: '10px',
                marginTop: 0,
            },
            formLabel: {
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                width: '100%',
                display: 'block',
                overflow: 'hidden',
            },
        };

        const {
            selectedAPI, selectedVersion, selectedResource, selectedLimit,
            apiList, versionList, operationList,
        } = this.state;

        return (
            <Scrollbars style={{ height }}>
                <div style={styles.mainDiv}>
                    <div style={styles.headingWrapper}>
                        <h3 style={styles.h3}>
                            <FormattedMessage
                                id='widget.heading'
                                defaultMessage='TOTAL API TRAFFIC'
                            />
                        </h3>
                    </div>
                    { inProgress ? (
                        <div style={styles.inProgress}>
                            <CircularProgress />
                        </div>
                    ) : (
                        <div>
                            { usageData.length !== 0 ? (
                                <div>
                                    <CustomFormGroup
                                        selectedAPI={selectedAPI}
                                        selectedVersion={selectedVersion}
                                        selectedResource={selectedResource}
                                        selectedLimit={selectedLimit}
                                        apiList={apiList}
                                        versionList={versionList}
                                        operationList={operationList}
                                        handleAPIChange={this.handleAPIChange}
                                        handleVersionChange={this.handleVersionChange}
                                        handleOperationChange={this.handleOperationChange}
                                        handleLimitChange={this.handleLimitChange}
                                    />
                                    <div style={styles.dataWrapper}>
                                        <TrafficChart
                                            data={usageData}
                                            themeName={themeName}
                                            setCurrentApi={setCurrentApi}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={styles.paperWrapper}>
                                    <Paper
                                        elevation={1}
                                        style={styles.paper}
                                    >
                                        <Typography
                                            variant='h5'
                                            component='h3'
                                        >
                                            <FormattedMessage
                                                id='nodata.error.heading'
                                                defaultMessage='No Data Available !'
                                            />
                                        </Typography>
                                        <Typography component='p'>
                                            <FormattedMessage
                                                id='nodata.error.body'
                                                defaultMessage='No data available for the selected options!.'
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Scrollbars>
        );
    }
}

APIMTotalApiTraffic.propTypes = {
    themeName: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    limit: PropTypes.string.isRequired,
    inProgress: PropTypes.bool.isRequired,
    height: PropTypes.number.isRequired,
};
