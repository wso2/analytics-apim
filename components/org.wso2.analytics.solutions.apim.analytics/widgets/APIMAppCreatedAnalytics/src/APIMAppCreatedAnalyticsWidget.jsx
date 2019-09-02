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
 * Query string parameter values
 * @type {object}
 */
const createdByKeys = {
    All: 'All',
    Me: 'Me',
};

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apps';

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
            apiCreatedBy: 'All',
            appCreatedBy: 'All',
            subscribedTo: 'All',
            timeTo: null,
            timeFrom: null,
            sublist: [],
            apilist: [],
            applist: [],
            chartData: null,
            tableData: null,
            xAxisTicks: null,
            maxCount: 0,
            localeMessages: null,
        };

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleSubListQuery = this.assembleSubListQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleSubscriptionsQuery = this.assembleSubscriptionsQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleSubListReceived = this.handleSubListReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleSubscriptionsReceived = this.handleSubscriptionsReceived.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.appCreatedHandleChange = this.appCreatedHandleChange.bind(this);
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
     * @memberof APIMAppCreatedAnalyticsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMAppCreatedAnalytics/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
        }, this.assembleSubListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { appCreatedBy } = queryParam;
        let { subscribedTo } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!appCreatedBy) {
            appCreatedBy = 'All';
        }
        if (!subscribedTo) {
            subscribedTo = 'All';
        }
        this.setState({ apiCreatedBy, appCreatedBy, subscribedTo });
        this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
    }

    /**
     * Formats the siddhi query - sublistquery
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    assembleSubListQuery() {
        this.resetState();
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.sublistquery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleSubListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleSubListQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleSubListReceived(message) {
        const { data } = message;
        const { id } = this.props;
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;

        if (data) {
            const sublist = ['All'];
            data.forEach((dataUnit) => {
                sublist.push(dataUnit.toString());
            });
            this.setState({ sublist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMAppCreatedAnalyticsWidget
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
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { id } = this.props;
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;
        const currentUser = super.getCurrentUser();

        if (data) {
            const apilist = [['All', 'All']];

            if (apiCreatedBy === createdByKeys.All) {
                data.forEach((dataUnit) => {
                    apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                });
            } else if (apiCreatedBy === createdByKeys.Me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[3]) {
                        apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                    }
                });
            }
            this.setState({ apilist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleSubscriptionsQuery();
    }

    /**
     * Formats the siddhi query - subscriptionsquery
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    assembleSubscriptionsQuery() {
        this.resetState();

        const { id } = this.props;
        const { providerConfig, apilist } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { subscribedTo } = queryParam;

        const apilistSliced = apilist.slice(1);
        const last = apilist.slice(-1)[0][0];
        let text = "API_ID=='";
        apilistSliced.forEach((api) => {
            if (api[0] !== last) {
                text += api[0] + "' or API_ID=='";
            } else {
                text += api[0] + "' ";
            }
        });

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.subscriptionsquery;
        if (subscribedTo === 'All') {
            query = query
                .replace('{{querystring}}', 'on (' + text + ')');
        } else {
            query = query
                .replace('{{querystring}}', "on API_ID=='{{api}}'")
                .replace('{{api}}', subscribedTo);
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleSubscriptionsReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleSubscriptionsQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleSubscriptionsReceived(message) {
        const { data } = message;
        const { id } = this.props;
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;

        if (data) {
            const applist = [];
            data.forEach((dataUnit) => {
                if (!applist.includes(dataUnit[0])) {
                    applist.push(dataUnit[0]);
                }
            });
            this.setState({ applist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            providerConfig, timeFrom, timeTo, applist, appCreatedBy,
        } = this.state;
        const last = applist[applist.length - 1];
        let text = '';
        applist.forEach((app) => {
            if (app !== last) {
                text += app + "' or APPLICATION_ID=='";
            } else {
                text += app;
            }
        });
        const { id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.mainquery;
        query = query
            .replace('{{timeFrom}}', Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'))
            .replace('{{timeTo}}', Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'));
        if (appCreatedBy === 'All' && text === '') {
            query = query
                .replace('{{querystring}}', "AND APPLICATION_ID=='0'");
        } else if (appCreatedBy !== 'All' && text !== '') {
            query = query
                .replace('{{querystring}}', "AND (APPLICATION_ID=='{{appList}}') AND CREATED_BY=='{{creator}}'")
                .replace('{{appList}}', text)
                .replace('{{creator}}', appCreatedBy);
        } else if (appCreatedBy !== 'All') {
            query = query
                .replace('{{querystring}}', "AND APPLICATION_ID=='0' AND CREATED_BY=='{{creator}}'")
                .replace('{{creator}}', appCreatedBy);
        } else {
            query = query
                .replace('{{querystring}}', "AND (APPLICATION_ID=='{{appList}}')")
                .replace('{{appList}}', text);
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;

        if (data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            let index = 0;

            data.forEach((dataUnit) => {
                chartData.push({
                    x: new Date(dataUnit[2]).getTime(),
                    y: dataUnit[3] + index,
                    label: 'CREATED_TIME:' + Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss')
                        + '\nCOUNT:' + (dataUnit[3] + index++),
                });
                tableData.push({
                    id: index,
                    appname: dataUnit[1].toString(),
                    createdtime: Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss'),
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
                chartData, tableData, xAxisTicks, maxCount,
            });
        } else {
            this.setState({ chartData: [], tableData: [] });
        }

        this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} appCreatedBy - APP Created By menu option selected
     * @param {string} subscribedTo - Subscribed To menu option selected
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            appCreatedBy,
            subscribedTo,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    apiCreatedHandleChange(event) {
        const { appCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, appCreatedBy, 'All');
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle APP Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    appCreatedHandleChange(event) {
        const { apiCreatedBy, subscribedTo } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value, subscribedTo);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleSubListQuery();
    }

    /**
     * Handle Subscribed To menu select change
     * @param {Event} event - listened event
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    subscribedToHandleChange(event) {
        const { apiCreatedBy, appCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, appCreatedBy, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleSubscriptionsQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM App Created Analytics widget
     * @memberof APIMAppCreatedAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiCreatedBy, appCreatedBy, subscribedTo, apilist, sublist,
            chartData, tableData, xAxisTicks, maxCount,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const appCreatedProps = {
            themeName,
            height,
            apiCreatedBy,
            appCreatedBy,
            subscribedTo,
            apilist,
            sublist,
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
                                             APIM App Created Analytics widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMAppCreatedAnalytics
                                {...appCreatedProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                appCreatedHandleChange={this.appCreatedHandleChange}
                                subscribedToHandleChange={this.subscribedToHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMAppCreatedAnalytics', APIMAppCreatedAnalyticsWidget);
