/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React from 'react';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';

import APIMAppResourceUsage from './APIMAppResourceUsage';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'appResourceUsage';

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @return {number}
 * */
function sortFunction(a, b) {
    const nameA = a.appName.toLowerCase();
    const nameB = b.appName.toLowerCase();

    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

/**
 * Widget to display API resource usage of applications
 * @class APIMAppResourceUsageWidget
 * @extends {Widget}
 */
class APIMAppResourceUsageWidget extends Widget {
    constructor(props) {
        super(props);
        this.styles = {
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            proxyPaperWrapper: {
                height: '75%',
            },
            proxyPaper: {
                background: '#969696',
                width: '75%',
                padding: '4%',
                border: '1.5px solid #fff',
                margin: 'auto',
                marginTop: '5%',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            faultyProviderConfig: false,
            limit: 5,
            applicationUUIDMap: [],
            applicationList: [],
            applicationSelected: null,
            usageData: [],
            localeMessages: null,
            inProgress: true,
            proxyError: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.applicationSelectedHandleChange = this.applicationSelectedHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleAppQuery = this.assembleAppQuery.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getApplicationIds = this.getApplicationIds.bind(this);
        this.handleAppIdDataReceived = this.handleAppIdDataReceived.bind(this);
    }

    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch((error) => {
                // TODO: Show error message.
            });
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     *
     * @param {string} locale Locale name
     * @memberof APIMAppResourceUsageWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMAppResourceUsage/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Retrieves the applications of the subscriber
     * @memberof APIMAppResourceUsageWidget
     * */
    assembleAppQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/applications`)
            .then((response) => {
                this.setState({ proxyError: null });
                this.handleAppDataReceived(response.data);
            })
            .catch(error => {
                if (error.response && error.response.data) {
                    let proxyError = error.response.data;
                    proxyError = proxyError.split(':').splice(1).join('').trim();
                    this.setState({ proxyError, inProgress: false });
                }
                console.error(error);
            });
    }

    /**
     * Formats applciations data retrieved from APIM server
     * @param {object} data - data retrieved
     * @memberof APIMAppApiUsageWidget
     * */
    handleAppDataReceived(data) {
        const { list } = data;

        if (list) {
            const applicationUUIDMap = {};
            list.map((dataUnit) => {
                applicationUUIDMap[dataUnit.applicationId] = {
                    appName: dataUnit.name + ' (' + dataUnit.owner + ')',
                    appOwner: dataUnit.owner,
                };
            });
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ applicationUUIDMap }, this.getApplicationIds);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve API Id from API UUID
     */
    getApplicationIds() {
        const { applicationUUIDMap, providerConfig } = this.state;

        if (providerConfig) {
            const { id, widgetID: widgetName } = this.props;
            const dataProviderConfigs = cloneDeep(providerConfig);

            dataProviderConfigs.configs.config.queryData.queryName = 'applicationQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{applicationUUID}}': 'UUID==\'' + Object.keys(applicationUUIDMap).join('\' OR UUID==\'') + '\''
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAppIdDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleAppQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppResourceUsageWidget
     * */
    handleAppIdDataReceived(message) {
        const { data } = message;
        const { id } = this.props;
        const { applicationUUIDMap } = this.state;

        if (data) {
            const queryParam = super.getGlobalState(queryParamKey);
            let { applicationSelected, limit } = queryParam;
            if (!limit || limit < 0) {
                limit = 5;
            }
            const applicationList = data.map((dataUnit) => {
                const app = applicationUUIDMap[dataUnit[1]];
                app.appId = dataUnit[0];
                return app;
            });
            applicationList.sort(sortFunction);
            applicationList.unshift({
                appId: 'All',
                appName: 'All',
            });

            if (!applicationSelected
                || !applicationList.some(application => application.appId === applicationSelected)) {
                applicationSelected = 'All';
            }
            this.setQueryParam(applicationSelected, limit);
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ applicationList, applicationSelected, limit }, this.assembleMainQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMAppResourceUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: true,
        }, this.assembleAppQuery);
    }

    /**
     * Retrieve Api resource usage of selected application
     * @memberof APIMAppResourceUsageWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, applicationList,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { applicationSelected, limit } = queryParam;

        if (applicationSelected && limit) {
            const { id, widgetID: widgetName } = this.props;
            const dataProviderConfigs = cloneDeep(providerConfig);
            const applicationIds = applicationList.map(app => { return app.appId; });
            let applicationCondition;

            if (applicationSelected === 'All') {
                applicationCondition = 'applicationId==\'' + applicationIds.join('\' OR applicationId==\'') + '\'';
                applicationCondition = applicationCondition.replace('applicationId==\'All\' OR ', '');
            } else {
                applicationCondition = 'applicationId==\'' + applicationSelected + '\'';
            }

            dataProviderConfigs.configs.config.queryData.queryName = 'resourceUsageQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{application}}': applicationCondition,
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppResourceUsageWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = data.map((dataUnit) => {
                return {
                    apiName: dataUnit[0] + ' (' + dataUnit[2].replace('-AT-', '@') + ')',
                    version: dataUnit[1],
                    resource: dataUnit[4] + ' (' + dataUnit[3] + ')',
                    hits: dataUnit[5],
                };
            });
            this.setState({ usageData, inProgress: false });
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} applicationSelected - selected application
     * @param {number} limit - data limitation value
     * @memberof APIMAppResourceUsageWidget
     * */
    setQueryParam(applicationSelected, limit) {
        super.setGlobalState(queryParamKey, {
            applicationSelected,
            limit,
        });
    }

    /**
     * Handle onChange of limit
     * @param {Event} event - listened event
     * @memberof APIMAppResourceUsageWidget
     * */
    handleLimitChange(event) {
        const { id } = this.props;
        const { applicationSelected } = this.state;
        // disallow negative and decimal values
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(applicationSelected, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle onChange of selected application
     * @param {Event} event - listened event
     * @memberof APIMAppResourceUsageWidget
     * */
    applicationSelectedHandleChange(event) {
        this.setState({ inProgress: true });
        let { limit } = this.state;
        const { id } = this.props;

        if (!limit) {
            limit = 5;
        }

        this.setQueryParam(event.target.value, limit);
        this.setState({ applicationSelected: event.target.value, limit });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Resource Usage of Application widget
     * @memberof APIMAppResourceUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, applicationSelected, usageData, applicationList,
            inProgress, proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const resourceUsageProps = {
            themeName,
            height,
            limit,
            applicationList,
            applicationSelected,
            usageData,
            inProgress,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    { proxyError ? (
                        <div style={proxyPaperWrapper}>
                            <Paper
                                elevation={1}
                                style={proxyPaper}
                            >
                                <Typography variant='h5' component='h3'>
                                    <FormattedMessage
                                        id='apim.server.error.heading'
                                        defaultMessage='Error!' />
                                </Typography>
                                <Typography component='p'>
                                    { proxyError }
                                </Typography>
                            </Paper>
                        </div>
                    ) : (
                        <div>
                            {
                                faultyProviderConfig ? (
                                    <div style={paperWrapper}>
                                        <Paper elevation={1} style={paper}>
                                            <Typography variant='h5' component='h3'>
                                                <FormattedMessage
                                                    id='config.error.heading'
                                                    defaultMessage='Configuration Error !'
                                                />
                                            </Typography>
                                            <Typography component='p'>
                                                <FormattedMessage
                                                    id='config.error.body'
                                                    defaultMessage={'Cannot fetch provider configuration for APIM'
                                                    + ' Resource Usage of Application widget'}
                                                />
                                            </Typography>
                                        </Paper>
                                    </div>
                                ) : (
                                    <APIMAppResourceUsage
                                        {...resourceUsageProps}
                                        applicationSelectedHandleChange={this.applicationSelectedHandleChange}
                                        handleLimitChange={this.handleLimitChange}
                                    />
                                )
                            }
                        </div>
                    )}
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMAppResourceUsage', APIMAppResourceUsageWidget);
