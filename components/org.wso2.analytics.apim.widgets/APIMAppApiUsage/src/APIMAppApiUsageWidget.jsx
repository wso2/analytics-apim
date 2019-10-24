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
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';

import APIMAppApiUsage from './APIMAppApiUsage';

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
const queryParamKey = 'appApiUsage';

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
 * Compare two values and return sorting order
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
 * Widget for displaying API usage of applications
 * @class APIMAppApiUsageWidget
 * @extends {Widget}
 */
class APIMAppApiUsageWidget extends Widget {
    constructor(props) {
        super(props);
        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            loading: {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
            limit: 5,
            applicationUUIDMap: [],
            applicationList: [],
            applicationSelected: null,
            usageData: [],
            legendData: [],
            localeMessages: null,
            inProgress: true,
            proxyError: true,
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
        this.handleAppIdDataReceived = this.handleAppIdDataReceived.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getApplicationIds = this.getApplicationIds.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;

        this.loadLocale(locale);
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
     * @memberof APIMAppApiUsageWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMAppApiUsage/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMAppApiUsageWidget
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
     * Retrieve applications for subscriber
     * @memberof APIMAppApiUsageWidget
     * */
    assembleAppQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/applications`)
            .then((response) => {
                this.setState({ proxyError: false });
                this.handleAppDataReceived(response.data);
            })
            .catch(error => {
                this.setState({ proxyError: true });
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
                '{{applicationUUID}}': 'UUID==\'' + Object.keys(applicationUUIDMap).join('\' or UUID==\'') + '\''
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAppIdDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from applicationUUIDMap
     * @param {object} message - data retrieved
     * @memberof APIMAppApiUsageWidget
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
     * Retrive Api usage stats for selected application
     * @memberof APIMAppApiUsageWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, applicationList,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { applicationSelected, limit } = queryParam;

        if (applicationSelected && limit && providerConfig) {
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

            dataProviderConfigs.configs.config.queryData.queryName = 'apiUsageQuery';
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
     * @memberof APIMAppApiUsageWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = data.map((dataUnit) => {
                return {
                    apiName: dataUnit[0] + ' (' + dataUnit[2].replace('-AT-', '@') + ')',
                    version: dataUnit[1],
                    hits: dataUnit[3],
                };
            });
            const legendData = usageData.map((dataUnit) => {
                return { name: dataUnit.apiName };
            });
            this.setState({ usageData, legendData, inProgress: false });
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} applicationSelected - selected application
     * @param {number} limit - data limitation value
     * @memberof APIMAppApiUsageWidget
     * */
    setQueryParam(applicationSelected, limit) {
        super.setGlobalState(queryParamKey, {
            applicationSelected,
            limit,
        });
    }

    /**
     * Handle onchange of limit
     * @param {Event} event - listened event
     * @memberof APIMAppApiUsageWidget
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
     * @memberof APIMAppApiUsageWidget
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
     * @returns {ReactElement} Render the APIM Application Usage widget
     * @memberof APIMAppApiUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, limit, applicationSelected, usageData, legendData,
            applicationList, inProgress, proxyError,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName,
            height,
            width,
            limit,
            applicationList,
            applicationSelected,
            usageData,
            legendData,
            inProgress,
        };

        if (proxyError) {
            return (
                <div style={styles.proxyPaperWrapper}>
                    <Paper
                        elevation={1}
                        style={styles.proxyPaper}
                    >
                        <Typography variant='h5' component='h3'>
                            <FormattedMessage
                                id='apim.server.error.heading'
                                defaultMessage='APIM Server Connection Error!' />
                        </Typography>
                        <Typography component='p'>
                            <FormattedMessage
                                id='apim.server.error.body'
                                defaultMessage='Error occurred when retrieving API list from APIM Publisher'
                            />
                        </Typography>
                    </Paper>
                </div>
            );
        }

        if (!localeMessages || !usageData) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
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
                                            + ' Application Usage widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMAppApiUsage
                                {...apiUsageProps}
                                applicationSelectedHandleChange={this.applicationSelectedHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMAppApiUsage', APIMAppApiUsageWidget);
