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
import Moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMAppCreatedAnalytics from './APIMAppCreatedAnalytics';

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
const queryParamKey = 'appCreatedStats';

/**
 * Callback suffixes
 * @type {string}
 */
const MAIN_CALLBACK = '-main';
const SUBSCRIBER_CALLBACK = '-subscriber';

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
 * Create React Component for APIM App Created Analytics
 * @class APIMAppCreatedAnalyticsWidget
 * @extends {Widget}
 */
class APIMAppCreatedAnalyticsWidget extends Widget {
    /**
     * Creates an instance of APIMAppCreatedAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMAppCreatedAnalyticsWidget
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
            appCreatedBy: 'All',
            limit: 5,
            timeTo: null,
            timeFrom: null,
            sublist: [],
            chartData: null,
            tableData: null,
            localeMessages: null,
            inProgress: true,
            dimension: null,
            selectedOptions: [],
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleSubListQuery = this.assembleSubListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleSubListReceived = this.handleSubListReceived.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.appCreatedHandleChange = this.appCreatedHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
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
        this.loadQueryParam();

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
        super.getWidgetChannelManager().unsubscribeWidget(id + SUBSCRIBER_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + MAIN_CALLBACK);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMAppCreatedAnalyticsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMAppCreatedAnalytics/locales/${locale}.json`)
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
     * Retrieve the appCreateBy value from query param
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    loadQueryParam() {
        const { appCreatedBy } = super.getGlobalState(queryParamKey);
        let { limit } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setQueryParam(appCreatedBy, limit);
        this.setState({ appCreatedBy, limit });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMAppCreatedAnalyticsWidget
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
            }, this.assembleSubListQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleSubListQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleSubListQuery);
        }
    }

    /**
     * Formats the siddhi query - sublistquery
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    assembleSubListQuery() {
        const {
            providerConfig, dimension, selectedOptions, timeFrom,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                const dataProviderConfigs = cloneDeep(providerConfig);
                const { config } = dataProviderConfigs.configs;

                config.tableName = 'AM_SUBSCRIBER';
                config.incrementalColumn = 'SUBSCRIBER_ID';
                config.queryData.queryName = 'sublistquery';
                dataProviderConfigs.configs.config = config;
                super.getWidgetChannelManager().subscribeWidget(id + SUBSCRIBER_CALLBACK, widgetName,
                    this.handleSubListReceived, dataProviderConfigs);
            } else {
                this.setState({ chartData: [], tableData: [], inProgress: false });
            }
        }
    }

    /**
     * Formats data retrieved from assembleSubListQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleSubListReceived(message) {
        const { data } = message;
        let { appCreatedBy } = { ...this.state };
        const { limit } = this.state;

        if (data && data.length > 0) {
            let sublist = data.map((dataUnit) => {
                return dataUnit[0];
            });
            sublist = [...new Set(sublist)];
            sublist.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            sublist.unshift('All');

            if (!sublist.includes(appCreatedBy)) {
                [appCreatedBy] = sublist;
            }
            this.setQueryParam(appCreatedBy,limit);
            this.setState({ sublist, appCreatedBy }, this.assembleMainQuery);
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, timeFrom, timeTo, appCreatedBy, selectedOptions, sublist, limit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        const { config } = dataProviderConfigs.configs;
        const apiList = selectedOptions.map((opt) => { return opt.name; });

        if (limit > 0) {
            config.queryData.queryName = 'mainquery';
            config.tableName = 'AM_APPLICATION';
            config.incrementalColumn = 'CREATED_TIME';
            config.queryData.queryValues = {
                '{{subscriptionTable}}':
                    (appCreatedBy !== 'All' || apiList[0] !== 'All') ? ', AM_API api, AM_SUBSCRIPTION subc' : '',
                '{{subscription}}': (appCreatedBy !== 'All' || apiList[0] !== 'All')
                    ? 'AND api.API_ID=subc.API_ID AND app.APPLICATION_ID=subc.APPLICATION_ID' : '',
                '{{apiName}}': apiList[0] !== 'All' ? 'AND api.API_NAME in (\'' + apiList.join('\', \'') + '\')' : '',
                '{{subscriberId}}': appCreatedBy !== 'All' ? 'AND sub.USER_ID = \'' + appCreatedBy + '\''
                    : 'AND sub.USER_ID IN (\'' + sublist.join('\', \'') + '\')',
                '{{timeFrom}}': Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'),
                '{{timeTo}}': Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'),
            };
            config.publishingLimit = limit;
            dataProviderConfigs.configs.config = config;
            super.getWidgetChannelManager().subscribeWidget(id + MAIN_CALLBACK, widgetName,
                this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const tableData = data.map((dataUnit) => {
                return {
                    appname: dataUnit[1] + ' (' + dataUnit[2] + ')',
                    createdtime: Moment(dataUnit[0]).format('YYYY-MMM-DD hh:mm:ss A'),
                };
            });
            const timeFormat = this.getDateFormat();
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = Moment(obj[0]).format(timeFormat);
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key]++;
                return acc;
            }, {});
            const chartData = Object.keys(dataGroupByTime).map((key) => {
                return [dataGroupByTime[key], Moment(key, timeFormat).toDate().getTime()];
            });
            chartData.sort((a, b) => { return a[1] - b[1]; });
            this.setState({
                chartData, tableData, inProgress: false,
            });
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
        }
    }

    /**
     * Get time format for the selected granularity
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    getDateFormat() {
        const { perValue } = this.state;
        switch (perValue) {
            case 'minute':
                return 'YYYY-MMM-DD HH:mm';
            case 'hour':
                return 'YYYY-MMM-DD HH';
            case 'day':
                return 'YYYY-MMM-DD';
            case 'month':
                return 'YYYY-MMM';
            case 'year':
                return 'YYYY';
            case 'second':
            default:
                return 'YYYY-MMM-DD HH:mm:ss';
        }
    }

    /**
     * Updates query param values
     * @param {string} appCreatedBy - APP Created By menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    setQueryParam(appCreatedBy, limit) {
        super.setGlobalState(queryParamKey, { appCreatedBy, limit });
    }

    /**
     * Handle APP Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    appCreatedHandleChange(event) {
        const { limit } = this.state;
        this.setQueryParam(event.target.value, limit);
        this.setState({ appCreatedBy: event.target.value, inProgress: true }, this.assembleMainQuery);
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleLimitChange(event) {
        const { appCreatedBy } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(appCreatedBy, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleMainQuery);
        } else {
            this.setState({ limit, chartData: [], tableData: [] });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM App Created Analytics widget
     * @memberof APIMAppCreatedAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, appCreatedBy, sublist, chartData, tableData, limit,
            width, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const appCreatedProps = {
            themeName,
            height,
            appCreatedBy,
            sublist,
            chartData,
            tableData,
            width,
            inProgress,
            username,
            limit,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM App '
                                            + 'Created Analytics widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMAppCreatedAnalytics
                                {...appCreatedProps}
                                appCreatedHandleChange={this.appCreatedHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMAppCreatedAnalytics', APIMAppCreatedAnalyticsWidget);
