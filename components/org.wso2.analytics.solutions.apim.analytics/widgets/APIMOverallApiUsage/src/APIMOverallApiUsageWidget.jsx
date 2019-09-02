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
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMOverallApiUsage from './APIMOverallApiUsage';

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

const createdByKeys = {
    all: 'all',
    me: 'me',
};

const queryParamKey = 'overallapiusage';

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
 * Create React Component for APIM Overall Api Usage
 * @class APIMOverallApiUsageWidget
 * @extends {Widget}
 */
class APIMOverallApiUsageWidget extends Widget {
    /**
     * Creates an instance of APIMOverallApiUsageWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallApiUsageWidget
     */
    constructor(props) {
        super(props);

        this.chartConfig = {
            charts: [
                {
                    type: 'scatter',
                    x: 'API_NAME',
                    y: 'SUB_COUNT',
                    color: 'CREATED_BY',
                    size: 'REQ_COUNT',
                },
            ],
            append: false,
            style: {
                xAxisTickAngle: -8,
                tickLabelColor: '#506482',
            },
        };

        this.metadata = {
            names: ['API_NAME', 'CREATED_BY', 'REQ_COUNT', 'SUB_COUNT'],
            types: ['ordinal', 'ordinal', 'linear', 'linear'],
        };

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
            usageData: null,
            usageData1: null,
            apiIDlist: [],
            metadata: this.metadata,
            chartConfig: this.chartConfig,
            limit: 0,
            localeMessages: null,
        };

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleApiSubQuery = this.assembleApiSubQuery.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleApiSubReceived = this.handleApiSubReceived.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.limitHandleChange = this.limitHandleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
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
     * @memberof APIMOverallApiUsageWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiUsage/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMOverallApiUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiUsageQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMOverallApiUsageWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { limit } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'all';
        }
        if (!limit) {
            limit = 5;
        }
        this.setState({ apiCreatedBy, limit });
        this.setQueryParam(apiCreatedBy, limit);
    }

    /**
     * Formats the siddhi query - apiusagequery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiUsageQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { limit } = queryParam;
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.apiusagequery;
        query = query
            .replace('{{from}}', timeFrom)
            .replace('{{to}}', timeTo)
            .replace('{{per}}', perValue)
            .replace('{{limit}}', limit);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleApiUsageReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiUsageQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;
        const { apiCreatedBy, limit } = this.state;
        const currentUser = super.getCurrentUser();
        const { id } = this.props;

        if (data) {
            let usageData = [];

            if (apiCreatedBy === createdByKeys.all) {
                usageData = data;
            } else if (apiCreatedBy === createdByKeys.me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[1]) {
                        usageData.push(dataUnit);
                    }
                });
            }

            this.setState({ usageData });
            this.setQueryParam(apiCreatedBy, limit);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMOverallApiUsageWidget
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
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { usageData, apiCreatedBy, limit } = this.state;
        const { id } = this.props;

        if (data) {
            const apiIDlist = [];

            usageData.forEach((usageUnit) => {
                const api = [];
                data.forEach((dataUnit) => {
                    if (usageUnit[0] === dataUnit[1]) {
                        api.push(dataUnit[0]);
                    }
                });
                apiIDlist.push(api);
            });

            this.setState({ apiIDlist });
            this.setQueryParam(apiCreatedBy, limit);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiSubQuery();
    }

    /**
     * Formats the siddhi query - apisubquery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiSubQuery() {
        this.resetState();
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apisubquery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleApiSubReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiSubQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiSubReceived(message) {
        const { data } = message;

        if (data) {
            const {
                usageData, apiIDlist, apiCreatedBy, limit,
            } = this.state;
            let counter = 0;

            for (const api of apiIDlist) {
                let subscriptions = 0;
                api.forEach((apiID) => {
                    data.forEach((dataUnit) => {
                        if (apiID === dataUnit[0]) {
                            subscriptions += dataUnit[1];
                        }
                    });
                });
                usageData[counter][3] = subscriptions;
                counter++;
            }
            this.setState({ usageData1: usageData });
            this.setQueryParam(apiCreatedBy, limit);
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} limit - limit menu option selected
     * @memberof APIMOverallApiUsageWidget
     * */
    setQueryParam(apiCreatedBy, limit) {
        super.setGlobalState(queryParamKey, { apiCreatedBy, limit });
    }

    /**
     * Handle limit menu select change
     * @param {Event} event - listened event
     * @memberof APIMOverallApiUsageWidget
     * */
    limitHandleChange(event) {
        const { apiCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiUsageQuery();
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMOverallApiUsageWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, limit);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiUsageQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Api Usage widget
     * @memberof APIMOverallApiUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, width, limit, apiCreatedBy, usageData1, metadata, chartConfig,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const ovearllUsageProps = {
            themeName, width, limit, apiCreatedBy, usageData1, metadata, chartConfig,
        };

        if (!localeMessages || !usageData1) {
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
                                             APIM Overall Api Usage widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMOverallApiUsage
                                {...ovearllUsageProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                limitHandleChange={this.limitHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiUsage', APIMOverallApiUsageWidget);
