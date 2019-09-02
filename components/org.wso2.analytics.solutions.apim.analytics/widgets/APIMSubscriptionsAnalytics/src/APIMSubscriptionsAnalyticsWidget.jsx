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
import Widget from '@wso2-dashboards/widget';
import Moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMSubscriptionsAnalytics from './APIMSubscriptionsAnalytics';

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
 * Query string parameter values
 * @type {object}
 */
const createdByKeys = {
    all: 'all',
    me: 'me',
};

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'subscriptions';

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
 * Create React Component for APIM Subscriptions Analytics
 * @class APIMSubscriptionsAnalyticsWidget
 * @extends {Widget}
 */
class APIMSubscriptionsAnalyticsWidget extends Widget {
    /**
     * Creates an instance of APIMSubscriptionsAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
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
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            apiCreatedBy: 'all',
            subscribedTo: 'all',
            timeTo: null,
            timeFrom: null,
            apilist: [],
            applist: [],
            chartData: null,
            tableData: null,
            xAxisTicks: null,
            maxCount: 0,
            localeMessages: null,
        };

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleAppListQuery = this.assembleAppListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleAppListReceived = this.handleAppListReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.subscribedToHandleChange = this.subscribedToHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
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
     * @param {string} locale Locale name
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMSubscriptionsAnalytics/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { subscribedTo } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'all';
        }
        if (!subscribedTo) {
            subscribedTo = 'all';
        }
        this.setState({ apiCreatedBy, subscribedTo });
        this.setQueryParam(apiCreatedBy, subscribedTo);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    assembleApiListQuery() {
        this.resetState();
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { apiCreatedBy, subscribedTo } = this.state;
        const currentUser = super.getCurrentUser();
        const { id } = this.props;

        if (data) {
            const apilist = [['all', 'All']];

            if (apiCreatedBy === createdByKeys.all) {
                data.forEach((dataUnit) => {
                    apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                });
            } else if (apiCreatedBy === createdByKeys.me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[3]) {
                        apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                    }
                });
            }
            this.setState({ apilist });
            this.setQueryParam(apiCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleAppListQuery();
    }

    /**
     * Formats the siddhi query - applistquery
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    assembleAppListQuery() {
        this.resetState();
        const { providerConfig } = this.state;
        const { id } = this.props;

        if (providerConfig) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            // eslint-disable-next-line max-len
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.applistquery;
            super.getWidgetChannelManager().subscribeWidget(id, this.handleAppListReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleAppListQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleAppListReceived(message) {
        const { data } = message;
        const { apiCreatedBy, subscribedTo } = this.state;
        const { id } = this.props;
        if (data) {
            this.setState({ applist: data });
            this.setQueryParam(apiCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, subscribedTo, apilist, providerConfig,
        } = this.state;
        const { id } = this.props;

        const apilistSliced = apilist.slice(1);
        const last = apilist.slice(-1)[0][0];
        let text = '';
        apilistSliced.forEach((api) => {
            if (api[0] !== last) {
                text += api[0] + "' OR API_ID=='";
            } else {
                text += api[0];
            }
        });

        if (providerConfig) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.mainquery;
            query = query
                .replace('{{timeFrom}}', Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'))
                .replace('{{timeTo}}', Moment(timeTo).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'));
            if (subscribedTo === 'all') {
                query = query
                    .replace('{{querystring}}', "AND (API_ID=='{{apilist}}')")
                    .replace('{{apilist}}', text);
            } else {
                query = query
                    .replace('{{querystring}}', "AND API_ID=='{{apiID}}'")
                    .replace('{{apiID}}', subscribedTo);
            }
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, subscribedTo, apilist, applist,
        } = this.state;

        if (data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            let index = 0;
            let tdataCount = 0;

            data.forEach((dataUnit) => {
                chartData.push({
                    x: new Date(dataUnit[2]).getTime(),
                    y: dataUnit[3] + index,
                    label: 'CREATED_TIME:' + Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss') + '\nCOUNT:'
                        + (dataUnit[3] + index++),
                });
                for (let i = 0; i < apilist.length; i++) {
                    if (apilist[i][0] === dataUnit[0]) {
                        tableData.push([apilist[i][1]]);
                    }
                }
                for (let j = 0; j < applist.length; j++) {
                    if (applist[j][0] === dataUnit[1]) {
                        tableData[tdataCount].push(applist[j][1]);
                    }
                }
                tableData[tdataCount++].push(Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss'));
            });

            const maxCount = chartData[chartData.length - 1].y;

            const first = new Date(chartData[0].x).getTime();
            const last = new Date(chartData[chartData.length - 1].x).getTime();
            const interval = (last - first) / 10;
            let duration = 0;
            xAxisTicks.push(first);
            for (let i = 1; i <= 10; i++) {
                duration = interval * i;
                xAxisTicks.push(new Date(first + duration).getTime());
            }

            this.setState({
                chartData, tableData, xAxisTicks, maxCount,
            });
        } else {
            this.setState({ chartData: [], tableData: [] });
        }

        this.setQueryParam(apiCreatedBy, subscribedTo);
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} subscribedTo - Subscribed To menu option selected
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    setQueryParam(apiCreatedBy, subscribedTo) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            subscribedTo,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    apiCreatedHandleChange(event) {
        const { id } = this.props;
        this.setQueryParam(event.target.value, 'all');
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle Subscribed To menu select change
     * @param {Event} event - listened event
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    subscribedToHandleChange(event) {
        const { apiCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Subscriptions Analytics widget
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiCreatedBy, subscribedTo, apilist,
            chartData, tableData, xAxisTicks, maxCount,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const subscriptionsProps = {
            themeName,
            height,
            apiCreatedBy,
            subscribedTo,
            apilist,
            chartData,
            tableData,
            xAxisTicks,
            maxCount,
        };

        if (!localeMessages || !chartData || !tableData) {
            return (<CircularProgress style={loadingIcon} />);
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    {
                        faultyProviderConfig ? (
                            <div
                                style={paperWrapper}
                            >
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage='Cannot fetch provider configuration for
                                             APIM Subscriptions Analytics widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMSubscriptionsAnalytics
                                {...subscriptionsProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                subscribedToHandleChange={this.subscribedToHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMSubscriptionsAnalytics', APIMSubscriptionsAnalyticsWidget);
