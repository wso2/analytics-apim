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
 * The suffix used to register callback function
 */
const API_ID_CALLBACK = '-api-id';
const API_RESOURCE_CALLBACK = '-api-resource';
const API_LATENCY_CALLBACK = '-api-latency';

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
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            latencyData: null,
            resourceList: [],
            operationSelected: [],
            resourceSelected: '',
            inProgress: true,
            apiId: null,
            dimension: null,
            selectedOptions: [],
            timeFrom: null,
            timeTo: null,
            perValue: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiIdReceived = this.handleApiIdReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.assembleApiIdQuery = this.assembleApiIdQuery.bind(this);
        this.assembleResourceQuery = this.assembleResourceQuery.bind(this);
        this.handleResourceReceived = this.handleResourceReceived.bind(this);
        this.apiOperationHandleChange = this.apiOperationHandleChange.bind(this);
        this.apiResourceHandleChange = this.apiResourceHandleChange.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(id + API_ID_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + API_RESOURCE_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + API_LATENCY_CALLBACK);
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
     * Retrieve the limit from query param
     * @memberof APIMApiLatencyWidget
     * */
    loadQueryParam() {
        const query = super.getGlobalState(queryParamKey);
        let { operationSelected, resourceSelected } = query;

        if (!operationSelected) {
            operationSelected = [];
        }
        if (!resourceSelected) {
            resourceSelected = '';
        }
        this.setQueryParam(operationSelected, resourceSelected);
        this.setState({ operationSelected, resourceSelected });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMApiLatencyWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam; const {
            from, to, granularity, dm, op,
        } = receivedMsg;
        const { selectedOptions: currentSelection, resourceList } = this.state;

        let resources = [];
        if ((op && op.length > 0) && (currentSelection && currentSelection.length > 0)) {
            if (currentSelection[0].name === op[0].name && currentSelection[0].version === op[0].version) {
                resources = resourceList;
            }
        }
        if (dm && from) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
                resourceList: resources,
            }, this.assembleApiIdQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
                resourceList: resources,
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
     * Formats the siddhi query - apiidquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleApiIdQuery() {
        const {
            providerConfig, dimension, selectedOptions, timeFrom,
        } = this.state;
        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                const { id, widgetID: widgetName } = this.props;

                const apiCondition = '(API_NAME==\'' + selectedOptions[0].name + '\' AND API_VERSION==\''
                    + selectedOptions[0].version + '\' AND API_PROVIDER==\'' + selectedOptions[0].provider + '\')';
                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{apiCondition}}': apiCondition,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id + API_ID_CALLBACK, widgetName, this.handleApiIdReceived, dataProviderConfigs);
            } else {
                this.setState({
                    inProgress: false, latencyData: [],
                });
            }
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleApiIdReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            this.setState({ apiId: data[0][0] }, this.assembleResourceQuery);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Formats the siddhi query - resourcequery
     * @memberof APIMApiLatencyWidget
     * */
    assembleResourceQuery() {
        const { providerConfig, apiId } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiId) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'resourcequery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiID}}': apiId,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + API_RESOURCE_CALLBACK, widgetName, this.handleResourceReceived,
                    dataProviderConfigs);
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
        const { operationSelected, resourceSelected } = this.state;

        if (data) {
            const resourceList = [];
            data.forEach((dataUnit) => {
                resourceList.push([dataUnit[0] + ' (' + dataUnit[1]] + ')');
            });
            this.setState({ resourceList });

            // verify whether the selected operations/resource provided in query param are available in the
            // API resource list
            const filterSelectedOperations = operationSelected.filter(op => resourceList.includes[op]);
            const filterSelectedResource = resourceList.includes(resourceSelected) ? resourceSelected : '';
            this.setQueryParam(filterSelectedOperations, filterSelectedResource);

            this.setState({
                resourceList,
                operationSelected: filterSelectedOperations,
                resourceSelected: filterSelectedResource,
            }, this.assembleMainQuery);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, operationSelected, resourceSelected, selectedOptions,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';

        if (selectedOptions && selectedOptions.length > 0
            && (operationSelected.length > 0 || resourceSelected.length > 0)) {
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

            const filterCondition = '(apiName==\'' + selectedOptions[0].name + '\' AND apiVersion==\''
                + selectedOptions[0].version + '\' AND (' + resources + '))';

            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{filterCondition}}': filterCondition,
                '{{numberOfCommas}}': numberOfSelectedElements - 1,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + API_LATENCY_CALLBACK, widgetName, this.handleDataReceived, dataProviderConfigs);
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
                operationSelected, resourceSelected,
            } = this.state;
            const latencyData = data.map((dataUnit) => {
                return ([dataUnit[0], dataUnit[1], dataUnit[2], dataUnit[3], dataUnit[4],
                    dataUnit[5], dataUnit[6], dataUnit[7]]);
            });
            this.setState({ latencyData, inProgress: false });
            this.setQueryParam(operationSelected, resourceSelected);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} operationSelected - Operations selected
     * @param {string} resourceSelected - Resources selected
     * @memberof APIMApiLatencyWidget
     * */
    setQueryParam(operationSelected, resourceSelected) {
        super.setGlobalState(queryParamKey, {
            operationSelected,
            resourceSelected,
        });
    }

    /**
     * Handle operation select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiOperationHandleChange(event) {
        const queryParam = super.getGlobalState(queryParamKey);
        const { operationSelected } = this.state;

        if (queryParam.operationSelected.includes(event.target.value)) {
            operationSelected.splice(operationSelected.indexOf(event.target.value), 1);
        } else {
            operationSelected.push(event.target.value);
        }
        this.setQueryParam(operationSelected, '');
        this.setState({ operationSelected, inProgress: true }, this.assembleMainQuery);
    }

    /**
         * Handle operation select change
         * @param {Event} event - listened event
         * @memberof APIMApiLatencyWidget
         * */
    apiResourceHandleChange(event) {
        const resourceSelected = event.target.value;

        this.setQueryParam([], resourceSelected);
        this.setState({ resourceSelected, inProgress: true }, this.assembleMainQuery);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Latency Time widget
     * @memberof APIMApiLatencyWidget
     */
    render() {
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            localeMessages, faultyProviderConfig, height, width, inProgress,
            latencyData, resourceList,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const latencyProps = {
            themeName,
            queryParam,
            height,
            width,
            latencyData,
            resourceList,
            inProgress,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
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
                                apiOperationHandleChange={this.apiOperationHandleChange}
                                apiResourceHandleChange={this.apiResourceHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiLatencyTime', APIMApiLatencyWidget);
