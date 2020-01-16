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
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
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
                    y: 'Response Time',
                    fill: '#1a911c',
                },
                {
                    type: 'line',
                    y: 'Security',
                    fill: '#bb3a1c',
                },
                {
                    type: 'line',
                    y: 'Throttling',
                    fill: '#aabb2e',
                },
                {
                    type: 'line',
                    y: 'Request Mediation',
                    fill: '#33bbb5',
                },
                {
                    type: 'line',
                    y: 'Response Mediation',
                    fill: '#b420bb',
                },
                {
                    type: 'line',
                    y: 'Backend',
                    fill: '#bbb2b9',
                },
                {
                    type: 'line',
                    y: 'Other',
                    fill: '#bb780f',
                },
            ],
            maxLength: 60,
            width: 800,
            height: 400,
            interactiveLegend: true,
            legend: true,
            timeFormat: '%Y-%m-%d %H:%M:%S',
            tipTimeFormat: '%Y-%m-%d %H:%M:%S',
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
            names: ['Response Time', 'Security', 'Throttling', 'Request Mediation',
                'Response Mediation', 'Backend', 'Other', 'REQUEST_TIME'],
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
            apiSelected: '',
            apiVersion: '',
            versionlist: [],
            versionMap: {},
            apilist: [],
            apiDataList: [],
            latencyData: null,
            apiFullData: [],
            resourceList: [],
            operationSelected: [],
            resourceSelected: '',
            inProgress: true,
            metadata: this.metadata,
            chartConfig: this.chartConfig,
            proxyError: false,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleApiIdReceived = this.handleApiIdReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.assembleApiIdQuery = this.assembleApiIdQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleResourceQuery = this.assembleResourceQuery.bind(this);
        this.handleResourceReceived = this.handleResourceReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.apiOperationHandleChange = this.apiOperationHandleChange.bind(this);
        this.apiResourceHandleChange = this.apiResourceHandleChange.bind(this);
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
     * @memberof APIMApiLatencyWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiLatencyTime/locales/${locale}.json`)
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
     * @memberof APIMApiLatencyWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: true,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMApiLatencyWidget
     * */
    resetState() {
        this.setState({ inProgress: true, latencyData: [] });
        const queryParam = super.getGlobalState(queryParamKey);
        let {
            apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected,
        } = queryParam;
        const { apilist, versionMap } = this.state;
        let versions;

        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected || (apilist && !apilist.includes(apiSelected))) {
            if (apilist.length > 0) {
                [apiSelected] = apilist;
            }
        }
        if (versionMap && apiSelected in versionMap) {
            versions = versionMap[apiSelected];
        } else {
            versions = [];
        }
        if (!apiVersion || !versions.includes(apiVersion)) {
            if (versions.length > 0) {
                [apiVersion] = versions;
            } else {
                apiVersion = '';
            }
        }
        if (!operationSelected) {
            operationSelected = [];
        }
        if (!resourceSelected) {
            resourceSelected = '';
        }

        this.setState({
            apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected, versionlist: versions,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected);
    }

    /**
     * Get API list from Publisher
     * @memberof APIMApiLatencyWidget
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
     * @memberof APIMApiLatencyWidget
     * */
    handleApiListReceived(data) {
        const { id } = this.props;
        const { list } = data;
        if (list && list.length > 0) {
            this.setState({ apiDataList: list });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiIdQuery();
    }

    /**
     * Formats the siddhi query - apiidquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleApiIdQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        const { providerConfig, apiDataList, username } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            let apiList = [...apiDataList];

            if (apiCreatedBy !== 'All') {
                apiList = apiList.filter((api) => { return api.provider === username; });
            }

            let apiCondition = apiList.map((api) => {
                return '(API_NAME==\'' + api.name + '\' AND API_VERSION==\'' + api.version
                    + '\' AND API_PROVIDER==\'' + api.provider + '\')';
            });
            apiCondition = apiCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiIdReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleApiIdReceived(message) {
        const { id } = this.props;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected } = queryParam;
        const { data } = message;

        if (data && data.length > 0) {
            let apilist = [];
            const versionMap = {};
            data.forEach((dataUnit) => {
                apilist.push(dataUnit[1]);
                // retrieve all entries for the api and get the api versions list
                const versions = data.filter(d => d[1] === dataUnit[1]);
                const versionlist = versions.map((ver) => { return ver[2]; });
                versionMap[dataUnit[1]] = versionlist;
            });
            apilist = [...new Set(apilist)];
            apilist.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            this.setState({
                apilist, versionMap, apiFullData: data, apiSelected,
            });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
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
        const { id, widgetID: widgetName } = this.props;

        if (apiFullData && apiFullData.length > 0) {
            const api = apiFullData.filter(apiData => apiSelected === apiData[1] && apiVersion === apiData[2])[0];

            if (api) {
                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'resourcequery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{apiID}}': api[0],
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleResourceReceived, dataProviderConfigs);
            } else {
                this.setState({ inProgress: false, latencyData: [] });
            }
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleResourceQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleResourceReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const resourceList = [];
            data.forEach((dataUnit) => {
                resourceList.push([dataUnit[0] + ' (' + dataUnit[1]] + ')');
            });
            this.setState({ resourceList });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;
        const {
            providerConfig, timeFrom, timeTo, perValue, operationSelected, resourceSelected,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';

        if (apiSelected !== '' && apiVersion !== '' && (operationSelected.length > 0 || resourceSelected.length > 0)) {
            let resources = '';
            let numberOfSelectedElements = 0;

            if (operationSelected.length > 0) {
                const operations = [];
                const operationTypes = [];
                let operationsString = '';
                let method = '';
                operationSelected.forEach((res) => {
                    const resFormat = res.split(' (');
                    operations.push(resFormat[0]);
                    method = resFormat[1].replace(')', '');
                    operationTypes.push(method);
                    numberOfSelectedElements += 1;
                });

                for (let i = 0; i < operations.length - 1; i++) {
                    operationsString += 'str:contains(apiResourceTemplate,\'' + operations[i] + '\') AND ';
                }
                operationsString += 'str:contains(apiResourceTemplate,\'' + operations[operations.length - 1] + '\')';

                resources = '((' + operationsString + ') AND apiMethod==\'' + method + '\')';
            } else if (resourceSelected.length > 0) {
                const resFormat = resourceSelected.split(' (');
                const resource = resFormat[0];
                const method = resFormat[1].replace(')', '');
                numberOfSelectedElements = 1;
                resources = '(apiResourceTemplate==\'' + resource + '\' AND apiMethod==\'' + method + '\')';
            }

            const queryCondition = ' AND (apiName==\'' + apiSelected + '\' AND apiVersion==\''
                + apiVersion + '\' AND (' + resources + '))';

            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{querystring}}': queryCondition,
                '{{numberOfCommas}}': numberOfSelectedElements - 1,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
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
                apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected,
            } = this.state;
            const latencyData = data.map((dataUnit) => {
                return ([dataUnit[0], dataUnit[1], dataUnit[2], dataUnit[3], dataUnit[4],
                    dataUnit[5], dataUnit[6], dataUnit[7]]);
            });
            this.setState({ latencyData, inProgress: false });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {string} operationSelected - Resources selected
     * @memberof APIMApiLatencyWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion, operationSelected, resourceSelected) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
            operationSelected,
            resourceSelected,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiCreatedHandleChange(event) {
        const { id } = this.props;
        this.setQueryParam(event.target.value, '', '', []);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.setState({ apiCreatedBy: event.target.value, inProgress: true }, this.assembleApiIdQuery);
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy } = this.state;
        const { id } = this.props;
        this.setQueryParam(apiCreatedBy, event.target.value, '', []);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.setState({
            apiSelected: event.target.value,
            versionlist: [],
            resourceList: [],
            inProgress: true,
        }, this.assembleResourceQuery);
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value, []);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.setState({ apiVersion: event.target.value, inProgress: true }, this.assembleResourceQuery);
    }

    /**
     * Handle operation select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiOperationHandleChange(event) {
        const { id } = this.props;
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            apiCreatedBy, apiSelected, apiVersion, operationSelected,
        } = this.state;
        if (queryParam.operationSelected.includes(event.target.value)) {
            operationSelected.splice(operationSelected.indexOf(event.target.value), 1);
        } else {
            operationSelected.push(event.target.value);
        }
        this.setState({ operationSelected, inProgress: true });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, operationSelected);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
         * Handle operation select change
         * @param {Event} event - listened event
         * @memberof APIMApiLatencyWidget
         * */
    apiResourceHandleChange(event) {
        const { id } = this.props;
        const {
            apiCreatedBy, apiSelected, apiVersion,
        } = this.state;

        const resourceSelected = event.target.value;
        this.state.resourceSelected = resourceSelected;

        this.setState({ resourceSelected, inProgress: true });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, [], resourceSelected);
        super.getWidgetChannelManager().unsubscribeWidget(id);
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
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width, inProgress, proxyError,
            apiCreatedBy, apiSelected, apiVersion, latencyData, apilist, versionlist, resourceList,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
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
            inProgress,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    { proxyError ? (
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
                    ) : (
                        <div>
                            {
                                faultyProviderConfig ? (
                                    <div style={paperWrapper}>
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
                                                    defaultMessage={'Cannot fetch provider configuration for APIM '
                                                    + 'Api Latency Time widget'}
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
                                        apiOperationHandleChange={this.apiOperationHandleChange}
                                        apiResourceHandleChange={this.apiResourceHandleChange}
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

global.dashboard.registerWidget('APIMApiLatencyTime', APIMApiLatencyWidget);
