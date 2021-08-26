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

import React from 'react';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import ApiUsageOverTime from './ApiUsageOverTime';

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

const queryParamKey = 'apiUsageTime';

const API_ID_CALLBACK = '-api-id';
const APP_ID_CALLBACK = '-app-id';
const APPLICATION_CALLBACK = '-applications';
const USAGE_CALLBACK = '-usage';

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
 * Create React Component for Api Usage Over Time
 * @class ApiUsageOverTimeWidget
 * @extends {Widget}
 */
class ApiUsageOverTimeWidget extends Widget {
    /**
     * Creates an instance of ApiUsageOverTimeWidget.
     * @param {any} props @inheritDoc
     * @memberof ApiUsageOverTimeWidget
     */
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
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            apiCreatedBy: 'all',
            usageData: null,
            localeMessages: null,
            inProgress: true,
            dimension: null,
            apiList: [],
            selectedOptions: [],
            timeFrom: null,
            timeTo: null,
            perValue: null,
            appData: [],
            selectedApp: 'All',
            apiIds: [],
            appIds: [],
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.assembleApplicationQuery = this.assembleApplicationQuery.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.loadSelectedApp = this.loadSelectedApp.bind(this);
        this.setQueryParam = this.setQueryParam.bind(this);
        this.applicationHandleChange = this.applicationHandleChange.bind(this);
        this.assembleApiIdQuery = this.assembleApiIdQuery.bind(this);
        this.handleApiIdDataReceived = this.handleApiIdDataReceived.bind(this);
        this.assembleSubscribedAppIdQuery = this.assembleSubscribedAppIdQuery.bind(this);
        this.handleSubscribedAppIdDataReceived = this.handleSubscribedAppIdDataReceived.bind(this);
    }

    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;
        this.loadSelectedApp();

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
        super.getWidgetChannelManager().unsubscribeWidget(id + API_ID_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + APP_ID_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + APPLICATION_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + USAGE_CALLBACK);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof ApiUsageOverTimeWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/ApiUsageOverTime/locales/${locale}.json`)
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
     * Retrieve the selected applications from query param
     * @memberof ApiUsageOverTimeWidget
     * */
    loadSelectedApp() {
        const { selectedApp } = super.getGlobalState(queryParamKey);
        this.setQueryParam(selectedApp);
        this.setState({ selectedApp });
    }


    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof ApiUsageOverTimeWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
            from, to, granularity, dm, op,
        } = receivedMsg;

        if (dm && from) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleApiIdQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleApiIdQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleApiIdQuery);
        }
    }

    /**
     * Retrieves API Ids of selected APIs
     * @memberof ApiUsageOverTimeWidget
     * */
    assembleApiIdQuery() {
        const {
            providerConfig, selectedOptions,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (selectedOptions && selectedOptions.length > 0) {
            let filterCondition = selectedOptions.map((opt) => {
                return '(API_NAME==\'' + opt.name + '\' AND API_VERSION==\'' + opt.version + '\')';
            });
            filterCondition = '(' + filterCondition.join(' OR ') + ')';

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{filterCondition}}': filterCondition,
            };
            super.getWidgetChannelManager().subscribeWidget(id + API_ID_CALLBACK, widgetName,
                this.handleApiIdDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof ApiUsageOverTimeWidget
     * */
    handleApiIdDataReceived(message) {
        const { data } = message;

        if (data) {
            const apiIds = data.map((dataUnit) => { return dataUnit[0]; });
            this.setState({ apiIds }, this.assembleSubscribedAppIdQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieves subscribed applications
     * @memberof ApiUsageOverTimeWidget
     * */
    assembleSubscribedAppIdQuery() {
        const {
            providerConfig, apiIds,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIds && apiIds.length > 0) {
            let filterCondition = apiIds.map((api) => {
                return 'API_ID==' + api;
            });
            filterCondition = '(' + filterCondition.join(' OR ') + ')';

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apisubquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}': filterCondition,
            };
            super.getWidgetChannelManager().subscribeWidget(id + APP_ID_CALLBACK, widgetName,
                this.handleSubscribedAppIdDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleSubscribedAppIdQuery
     * @param {object} message - data retrieved
     * @memberof ApiUsageOverTimeWidget
     * */
    handleSubscribedAppIdDataReceived(message) {
        const { data } = message;

        if (data) {
            const appIds = data.map((dataUnit) => { return dataUnit[0]; });
            this.setState({ appIds }, this.assembleApplicationQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieves application data
     * @memberof ApiUsageOverTimeWidget
     * */
    assembleApplicationQuery() {
        const { providerConfig, appIds } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (appIds && appIds.length > 0) {
            let appIdList = appIds.map((appId) => { return 'APPLICATION_ID==' + appId; });
            appIdList = appIdList.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'appQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{appIdList}}': appIdList,
            };
            super.getWidgetChannelManager().subscribeWidget(
                id + APPLICATION_CALLBACK, widgetName, this.handleAppDataReceived, dataProviderConfigs,
            );
        } else {
            const selectedApp = 'All';
            this.setQueryParam(selectedApp);
            this.setState({ selectedApp, appData:['All'] }, this.assembleApiUsageQuery);
        }
    }

    /**
     * Formats data retrieved from assembleApplicationQuery
     * @param {object} message - data retrieved
     * @memberof ApiUsageOverTimeWidget
     * */
    handleAppDataReceived(message) {
        const { data } = message;
        let { selectedApp } = { ...this.state };

        if (data) {
            const appData = data.map((dataUnit) => {
                return dataUnit[0] + ' (' + dataUnit[1] + ')';
            });
            appData.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            appData.unshift('All');
            if (!appData.includes(selectedApp)) {
                selectedApp = 'All';
                this.setQueryParam(selectedApp);
            }
            this.setState({ appData, selectedApp }, this.assembleApiUsageQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats the siddhi query - apiusagequery
     * @memberof ApiUsageOverTimeWidget
     * */
    assembleApiUsageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, dimension, selectedOptions, selectedApp,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0 && selectedApp) {
                let filterCondition = selectedOptions.map((opt) => {
                    if (selectedApp !== 'All') {
                        const appName = selectedApp.split(' (')[0].trim();
                        const appOwner = selectedApp.split(' (')[1].split(')')[0].trim();
                        return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\''
                            + ' AND applicationName==\'' + appName + '\' AND applicationOwner==\'' + appOwner + '\')';
                    }
                    return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
                });
                filterCondition = '(' + filterCondition.join(' OR ') + ')';

                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'apiusagequery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{filterCondition}}': filterCondition,
                    '{{from}}': timeFrom,
                    '{{to}}': timeTo,
                    '{{per}}': perValue,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id + USAGE_CALLBACK, widgetName, this.handleApiUsageReceived, dataProviderConfigs);
            } else {
                this.setState({
                    usageData: [], inProgress: false,
                });
            }
        }
    }

    /**
     * Formats data retrieved from assembleApiUsageQuery
     * @param {object} message - data retrieved
     * @memberof ApiUsageOverTimeWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;
        const { selectedOptions } = this.state;

        if (data && data.length > 0) {
            const apiList = selectedOptions
                .sort((a, b) => { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); })
                .map((api) => { return api.name + ' :: ' + api.version + ' (' + api.provider + ')'; });
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = obj[4];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({ apiname: obj[0] + ' :: ' + obj[3] + ' (' + obj[1] + ')', hits: obj[2] });
                return acc;
            }, {});
            const usageData = Object.keys(dataGroupByTime).map((key) => {
                const availableUsage = dataGroupByTime[key];
                const usage = [];
                apiList.forEach((api) => {
                    const apiUsage = availableUsage.find(selc => selc.apiname === api);
                    if (apiUsage) {
                        usage.push(apiUsage.hits);
                    } else {
                        usage.push(0);
                    }
                });
                usage.push(parseInt(key, 10));
                return usage;
            });
            this.setState({ usageData, apiList, inProgress: false });
        } else {
            this.setState({ usageData: [], inProgress: false });
        }
    }

    /**
     * Handle onChange of selected application
     * @param {String} value - selected application
     * @memberof ApiUsageOverTimeWidget
     * */
    applicationHandleChange(value) {
        this.setQueryParam(value);
        this.setState({ selectedApp: value, inProgress: true }, this.assembleApiUsageQuery);
    }

    /**
     * Updates query param values
     * @param {String} selectedApp - selected application
     * @memberof ApiUsageOverTimeWidget
     * */
    setQueryParam(selectedApp) {
        super.setGlobalState(queryParamKey, { selectedApp });
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Api Usage Over Time widget
     * @memberof ApiUsageOverTimeWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, width, height, usageData, inProgress, apiList, selectedApp, appData,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageOverTimeProps = {
            themeName, width, height, usageData, inProgress, apiList, selectedApp, appData,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
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
                                            defaultMessage={'Cannot fetch provider configuration for'
                                            + ' Api Usage Over Time widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <ApiUsageOverTime
                                {...apiUsageOverTimeProps}
                                applicationHandleChange={this.applicationHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('ApiUsageOverTime', ApiUsageOverTimeWidget);
