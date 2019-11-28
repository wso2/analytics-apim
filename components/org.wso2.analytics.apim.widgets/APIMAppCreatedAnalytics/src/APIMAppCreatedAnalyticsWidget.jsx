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
            username: null,
            inProgress: true,
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
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleSubListReceived = this.handleSubListReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.appCreatedHandleChange = this.appCreatedHandleChange.bind(this);
        this.subscribedToHandleChange = this.subscribedToHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.getUsername = this.getUsername.bind(this);
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
     * Get username of the logged in user
     */
    getUsername() {
        let { username } = super.getCurrentUser();
        // if email username is enabled, then super tenants will be saved with '@carbon.super' suffix, else, they
        // are saved without tenant suffix
        if (username.split('@').length === 2) {
            username = username.replace('@carbon.super', '');
        }
        this.setState({ username })
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
        const { apilist, sublist } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy, appCreatedBy, subscribedTo } = queryParam;

        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'All';
        }
        if (!appCreatedBy || (sublist.length > 0 && !sublist.includes(appCreatedBy))) {
            appCreatedBy = 'All';
        }
        if (!subscribedTo || (apilist.length > 0 && !apilist.includes(subscribedTo))) {
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
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        const { providerConfig, username} = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        let config = dataProviderConfigs.configs.config;

        config.tableName = 'AM_SUBSCRIBER';
        config.incrementalColumn = 'SUBSCRIBER_ID';
        config.queryData.queryName = 'sublistquery';
        config.queryData.queryValues = {
            '{{tablesNames}}': apiCreatedBy !== 'All' ?
            ', AM_API as api, AM_APPLICATION app, AM_SUBSCRIPTION subc' : '',
            '{{subscriptionCondition}}': apiCreatedBy !== 'All' ?
            'AND api.API_ID=subc.API_ID AND app.APPLICATION_ID=subc.APPLICATION_ID ' +
            'AND sub.SUBSCRIBER_ID=app.SUBSCRIBER_ID AND api.API_PROVIDER=\'{{provider}}\'' : '',
            '{{provider}}': username
        };
        dataProviderConfigs.configs.config = config;
        super.getWidgetChannelManager().subscribeWidget(id, widgetName, this.handleSubListReceived, dataProviderConfigs);
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
            let sublist = data.map((dataUnit) => {
                return dataUnit[0];
            });
            sublist = [...new Set(sublist)];
            sublist.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            sublist.unshift('All');
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
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        const { providerConfig, username } = this.state;
        const { id, widgetID: widgetName  } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let config = dataProviderConfigs.configs.config;

        config.tableName = 'AM_API';
        config.incrementalColumn = 'API_ID';
        config.queryData.queryName = 'apilistquery';
        config.queryData.queryValues = {
            '{{createdBy}}': apiCreatedBy === createdByKeys.Me ? 'AND CREATED_BY=\'{{creator}}\'' : '',
            '{{creator}}': username
        };
        dataProviderConfigs.configs.config = config;
        super.getWidgetChannelManager().subscribeWidget(id, widgetName, this.handleApiListReceived, dataProviderConfigs);
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

        if (data) {
            let apilist = data.map((dataUnit) => {
                return dataUnit[0];
            });
            apilist = [...new Set(apilist)];
            apilist.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            apilist.unshift('All');
            this.setState({ apilist });
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
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy, appCreatedBy, subscribedTo } = queryParam;
        const {
            providerConfig, timeFrom, timeTo, username, sublist,
        } = this.state;
        const { id, widgetID: widgetName  } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let config = dataProviderConfigs.configs.config;
        config.queryData.queryName = 'mainquery';

        config.tableName = 'AM_APPLICATION';
        config.incrementalColumn = 'CREATED_TIME';
        config.queryData.queryValues = {
            '{{subscriptionTable}}':
                (appCreatedBy !== 'All' || subscribedTo !== 'All') ? ', AM_API api, AM_SUBSCRIPTION subc' : '',
            '{{subscription}}': (appCreatedBy !== 'All' || subscribedTo !== 'All') ?
            'AND api.API_ID=subc.API_ID and app.APPLICATION_ID=subc.APPLICATION_ID' : '',
            '{{apiName}}': subscribedTo !== 'All' ? 'AND api.API_NAME = \'' + subscribedTo + '\'' : '',
            '{{apiProvider}}':
                (appCreatedBy !== 'All' || subscribedTo !== 'All') ? 'AND api.API_PROVIDER {{providerCondition}}' : '',
            '{{providerCondition}}':
            apiCreatedBy === 'All' ? 'in (\'' + sublist.slice(1).join('\', \'') + '\')' : '= \'' + username + '\'',
            '{{subscriberId}}': appCreatedBy !== 'All' ? 'and sub.USER_ID = \'' + appCreatedBy + '\'' : '',
            '{{timeFrom}}': Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'),
            '{{timeTo}}': Moment(timeTo).format('YYYY-MM-DD HH:mm:ss')
        };
        dataProviderConfigs.configs.config = config;
        super.getWidgetChannelManager().subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMAppCreatedAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            data.reverse();
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            // keep count of total applications
            let appCount = 0;

            data.forEach((dataUnit) => {
                appCount += dataUnit[0];
                chartData.push({
                    x: new Date(dataUnit[1]).getTime(),
                    y: appCount,
                    label: 'CREATED_TIME:' + Moment(dataUnit[1]).format('YYYY-MMM-DD HH:mm:ss')
                        + '\nCOUNT:' + appCount,
                });
                tableData.push({
                    appname: dataUnit[2] + ' (' + dataUnit[3] + ')',
                    createdtime: Moment(dataUnit[1]).format('YYYY-MMM-DD HH:mm:ss'),
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
                chartData, tableData, xAxisTicks, maxCount, inProgress: false
            });
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
        }
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
        this.setState({ apiCreatedBy: event.target.value, inProgress: true }, this.assembleApiListQuery);
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
        this.setState({ appCreatedBy: event.target.value, inProgress: true }, this.assembleMainQuery);
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
        this.setState({ subscribedTo: event.target.value, inProgress: true }, this.assembleMainQuery);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM App Created Analytics widget
     * @memberof APIMAppCreatedAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiCreatedBy, appCreatedBy, subscribedTo, apilist, sublist,
            chartData, tableData, xAxisTicks, maxCount, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
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
            inProgress,
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
