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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
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
            apiCreatedBy: 'All',
            subscribedTo: 'All',
            timeTo: null,
            timeFrom: null,
            apilist: [],
            chartData: null,
            tableData: null,
            xAxisTicks: null,
            maxCount: 0,
            localeMessages: null,
            inProgress: true,
            proxyError: false,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.subscribedToHandleChange = this.subscribedToHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.getUsername = this.getUsername.bind(this);
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
        this.getUsername();

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
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMSubscriptionsAnalytics/locales/`
                    + `${locale}.json`)
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
     * Get username of the logged in user
     */
    getUsername() {
        let { username } = super.getCurrentUser();
        // if email username is enabled, then super tenants will be saved with '@carbon.super' suffix, else, they
        // are saved without tenant suffix
        if (username.split('@').length === 2) {
            username = username.replace('@carbon.super', '');
        }
        this.setState({ username });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            inProgress: !sync,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy, subscribedTo } = queryParam;
        const { apilist } = this.state;
        if (!apiCreatedBy || !['All', 'Me'].includes(apiCreatedBy)) {
            apiCreatedBy = 'All';
        }
        if (!subscribedTo || (apilist.length > 0 && !apilist.includes(subscribedTo))) {
            subscribedTo = 'All';
        }
        this.setState({ apiCreatedBy, subscribedTo });
        this.setQueryParam(apiCreatedBy, subscribedTo);
    }

    /**
     * Get API list from Publisher
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    assembleApiListQuery() {
        this.resetState();
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.setState({ proxyError: false });
                this.handleApiListReceived(response.data);
            })
            .catch((error) => {
                this.setState({ proxyError: true, inProgress: false });
                console.error(error);
            });
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} data - data retrieved
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleApiListReceived(data) {
        const { id } = this.props;
        const { list } = data;
        if (list && list.length > 0) {
            this.setState({ apiDataList: list });
            let apilist = data.map((dataUnit) => { return dataUnit.name; });
            apilist = [...new Set(apilist)];
            apilist.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            apilist.unshift('All');
            this.setState({ apilist, apiDataList: list });
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
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy, subscribedTo } = queryParam;
        const {
            timeFrom, timeTo, providerConfig, username, apiDataList,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            let apiList = [...apiDataList];

            if (apiCreatedBy !== 'All') {
                apiList = apiList.filter((api) => { return api.provider === username; });
            }

            let apiCondition = apiList.map((api) => {
                return '(api.API_NAME===\'' + api.name + '\' AND api.API_VERSION==\'' + api.version
                    + '\' AND api.API_PROVIDER==\'' + api.provider + '\')';
            });
            apiCondition = apiCondition.join(' OR ');
            apiCondition.unshift('AND ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            const { config } = dataProviderConfigs.configs;

            config.tableName = 'AM_SUBSCRIPTION';
            config.incrementalColumn = 'CREATED_TIME';
            config.queryData.queryName = 'mainquery';
            config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition,
                '{{apiName}}': subscribedTo !== 'All' ? 'AND api.API_NAME=\'' + subscribedTo + '\'' : '',
                '{{timeFrom}}': Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'),
                '{{timeTo}}': Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'),
            };
            dataProviderConfigs.configs.config = config;
            super.getWidgetChannelManager().subscribeWidget(id, widgetName,
                this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
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
            apiCreatedBy, subscribedTo,
        } = this.state;

        if (data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            let count = 0;

            data.reverse();
            data.forEach((dataUnit) => {
                count += dataUnit[0];
                chartData.push({
                    x: new Date(dataUnit[1]).getTime(),
                    y: count,
                    label: 'CREATED_TIME:' + Moment(dataUnit[1]).format('YYYY-MMM-DD HH:mm:ss') + '\nCOUNT:' + count,
                });

                tableData.push({
                    apiname: dataUnit[2] + ' (' + dataUnit[3] + ')',
                    appname: dataUnit[4] + ' (' + dataUnit[5] + ')',
                    subscribedtime: Moment(dataUnit[1]).format('YYYY-MMM-DD HH:mm:ss'),
                });
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
                chartData, tableData, xAxisTicks, maxCount, inProgress: false,
            });
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
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
        this.setQueryParam(event.target.value, 'All');
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.setState({ apiCreatedBy: event.target.value, inProgress: true }, this.assembleApiListQuery);
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
        this.setState({ subscribedTo: event.target.value, inProgress: true }, this.assembleMainQuery);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Subscriptions Analytics widget
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiCreatedBy, subscribedTo, apilist, inProgress,
            chartData, tableData, xAxisTicks, maxCount, proxyError,
        } = this.state;
        const {
            paper, paperWrapper,proxyPaperWrapper, proxyPaper,
        } = this.styles;
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
            inProgress,
        };

        if (proxyError) {
            return (
                <IntlProvider locale={language} messages={localeMessages}>
                    <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                        <div style={proxyPaperWrapper}>
                            <Paper
                                elevation={1}
                                style={proxyPaper}
                            >
                                <Typography variant='h5' component='h3'>
                                    <FormattedMessage
                                        id='apim.server.error.heading'
                                        defaultMessage='Error!'
                                    />
                                </Typography>
                                <Typography component='p'>
                                    <FormattedMessage
                                        id='apim.server.error'
                                        defaultMessage='Error occurred while retrieving API list.'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    </MuiThemeProvider>
                </IntlProvider>
            );
        }

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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Subscriptions Analytics widget'}
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
