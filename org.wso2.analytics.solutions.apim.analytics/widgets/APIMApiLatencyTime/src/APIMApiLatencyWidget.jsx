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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import cloneDeep from 'lodash/cloneDeep';
import Moment from 'moment';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMApiLatency from './APIMApiLatency';

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
const queryParamKey = 'latencytime';

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
 * Create React Component for APIM Api Latency Time widget
 * @class APIMApiLatencyWidget
 * @extends {Widget}
 */
class APIMApiLatencyWidget extends Widget {
    /**
     * Creates an instance of APIMApiLatencyWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiLatencyWidget
     */
    constructor(props) {
        super(props);

        this.chartConfig = {
            x: 'REQUEST_TIME',
            charts: [
                {
                    type: 'line',
                    y: 'responseTime',
                    fill: '#4555bb',
                },
                {
                    type: 'line',
                    y: 'securityLatency',
                    fill: '#bb3a1c',
                },
                {
                    type: 'line',
                    y: 'throttlingLatency',
                    fill: '#aabb2e',
                },
                {
                    type: 'line',
                    y: 'requestMedLat',
                    fill: '#33bbb5',
                },
                {
                    type: 'line',
                    y: 'responseMedLat',
                    fill: '#b420bb',
                },
                {
                    type: 'line',
                    y: 'backendLatency',
                    fill: '#bbb2b9',
                },
                {
                    type: 'line',
                    y: 'otherLatency',
                    fill: '#bb780f',
                },
            ],
            maxLength: 60,
            width: 800,
            height: 400,
            interactiveLegend: true,
            legend: true,
            style: {
                xAxisTickAngle: -8,
                tickLabelColor: '#a7b0c8',
                axisLabelColor: '#a7b0c8',
                axisTextSize: 50,
                legendTextColor: '#a7b0c8',
                legendTextSize: 15,
            },
        };

        this.metadata = {
            names: ['responseTime', 'securityLatency', 'throttlingLatency', 'requestMedLat',
                'responseMedLat', 'backendLatency', 'otherLatency', 'REQUEST_TIME'],
            types: ['linear', 'linear', 'linear', 'linear', 'linear', 'linear', 'linear', 'time'],
        };

        this.styles = {
            formControl: {
                margin: 5,
                minWidth: 120,
            },
            selectEmpty: {
                marginTop: 10,
            },
            form: {
                display: 'flex',
                flexWrap: 'wrap',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            apiCreatedBy: 'All',
            apiSelected: '',
            apiVersion: '',
            versionlist: [],
            apilist: [],
            latencyData: null,
            apiFullData: [],
            resourceList: [],
            resSelected: [],
            metadata: this.metadata,
            chartConfig: this.chartConfig,
        };

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleResourceQuery = this.assembleResourceQuery.bind(this);
        this.handleResourceReceived = this.handleResourceReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.handleLatencyChange = this.handleLatencyChange.bind(this);
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
     * @memberof APIMApiLatencyWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiLatencyTime/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMApiLatencyWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMApiLatencyWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { apiSelected } = queryParam;
        let { apiVersion } = queryParam;
        let { resSelected } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected) {
            apiSelected = '';
        }
        if (!apiVersion) {
            apiVersion = '';
        }
        if (!resSelected) {
            resSelected = [];
        }
        this.setState({
            apiCreatedBy, apiSelected, apiVersion, resSelected,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleApiListQuery() {
        this.resetState();
        const { providerConfig } = this.state;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { apiSelected } = queryParam;
        let { apiVersion } = queryParam;
        let { resSelected } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected) {
            [[, apiSelected]] = data;
        }
        if (!apiVersion) {
            [[,, apiVersion]] = data;
        }
        if (!resSelected) {
            resSelected = [];
        }

        if (data) {
            const currentUser = super.getCurrentUser();
            const apilist = [];
            const versionlist = [];
            const apiFullData = data;
            if (apiCreatedBy === createdByKeys.All) {
                data.forEach((dataUnit) => {
                    if (!apilist.includes(dataUnit[1])) {
                        apilist.push(dataUnit[1]);
                    }
                    if (apiSelected === dataUnit[1]) {
                        versionlist.push(dataUnit[2]);
                    }
                });
            } else if (apiCreatedBy === createdByKeys.Me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[3]) {
                        if (!apilist.includes(dataUnit[1])) {
                            apilist.push(dataUnit[1]);
                        }
                        if (apiSelected === dataUnit[1]) {
                            versionlist.push(dataUnit[2]);
                        }
                    }
                });
            }
            this.setState({
                apiCreatedBy, apiSelected, apiVersion, resSelected, apilist, versionlist, apiFullData,
            });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleResourceQuery();
    }

    /**
     * Formats the siddhi query - resourcequery
     * @memberof APIMApiLatencyWidget
     * */
    assembleResourceQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;
        const { providerConfig, apiFullData } = this.state;
        const { id } = this.props;
        let apiID = 0;

        apiFullData.forEach((api) => {
            if (apiSelected === api[1] && apiVersion === api[2]) {
                [apiID] = api;
            }
        });

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.resourcequery;
        query = query
            .replace('{{apiID}}', apiID);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleResourceReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleResourceQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleResourceReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, resSelected,
        } = this.state;

        if (data) {
            const resourceList = [];
            data.forEach((dataUnit) => {
                resourceList.push([dataUnit[0] + ' (' + dataUnit[1]] + ')');
            });
            this.setState({ resourceList });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            providerConfig, timeFrom, timeTo, perValue, resSelected, apiSelected, apiVersion,
        } = this.state;
        const last = resSelected.slice(-1).toString();
        let text = "(apiResourceTemplate=='";
        resSelected.forEach((res) => {
            const resFormat = res.split('(');
            const resource = resFormat[resFormat.length - 2].replace(' ', '');
            const method = resFormat[resFormat.length - 1].replace(')', '');
            if (res !== last) {
                text += resource + "' AND apiMethod=='" + method + "') OR (apiResourceTemplate=='";
            } else {
                text += resource + "' AND apiMethod=='" + method + "')";
            }
        });
        this.setState({ latencyData: null });

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.mainquery;
        query = query
            .replace('{{timeFrom}}', timeFrom)
            .replace('{{timeTo}}', timeTo)
            .replace('{{per}}', perValue);
        if (apiSelected !== '' && apiVersion !== '' && resSelected.length !== 0) {
            query = query
                .replace('{{querystring}}', "on apiName=='{{api}}' AND apiVersion=='{{version}}' AND (" + text + ')')
                .replace('{{api}}', apiSelected)
                .replace('{{version}}', apiVersion);
        } else if (apiSelected !== '' && apiVersion !== '') {
            query = query
                .replace('{{querystring}}',
                    "on apiName=='{{api}}' AND apiVersion=='{{version}}' AND apiResourceTemplate==''")
                .replace('{{api}}', apiSelected)
                .replace('{{version}}', apiVersion);
        } else {
            query = query
                .replace('{{querystring}}', "on apiResourceTemplate==''");
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const {
                apiCreatedBy, apiSelected, apiVersion, resSelected,
            } = this.state;
            const latencyData = [];
            data.forEach((dataUnit) => {
                latencyData.push([dataUnit[0], dataUnit[1], dataUnit[2], dataUnit[3], dataUnit[4],
                    dataUnit[5], dataUnit[6], Moment(dataUnit[7]).format('YYYY-MMM-DD hh:mm:ss')]);
            });
            this.setState({ latencyData });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {string} resSelected - Resources selected
     * @memberof APIMApiResponseWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
            resSelected,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiCreatedHandleChange(event) {
        this.setQueryParam(event.target.value, '', '', []);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy } = this.state;

        this.setQueryParam(apiCreatedBy, event.target.value, '', []);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected } = this.state;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value, []);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleResourceQuery();
    }

    /**
     * Handle Resources select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    handleLatencyChange(event) {
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            apiCreatedBy, apiSelected, apiVersion, resSelected,
        } = this.state;
        if (queryParam.resSelected.includes(event.target.value)) {
            resSelected.splice(resSelected.indexOf(event.target.value), 1);
        } else {
            resSelected.push(event.target.value);
        }
        this.setState({ resSelected });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Latency Time widget
     * @memberof APIMApiLatencyWidget
     */
    render() {
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width,
            apiCreatedBy, apiSelected, apiVersion, latencyData, apilist, versionlist, resourceList,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const latencyProps = {
            themeName,
            queryParam,
            chartConfig,
            metadata,
            height,
            width,
            apiCreatedBy,
            apiSelected,
            apiVersion,
            latencyData,
            apilist,
            versionlist,
            resourceList,
        };

        if (!localeMessages || !latencyData) {
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
                                             APIM Api Latency Time widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiLatency
                                {...latencyProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
                                handleLatencyChange={this.handleLatencyChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiLatencyTime', APIMApiLatencyWidget);
