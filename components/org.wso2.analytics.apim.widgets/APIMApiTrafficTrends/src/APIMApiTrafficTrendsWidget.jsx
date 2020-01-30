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
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
import Moment from 'moment';
import APIMApiTrafficTrends from './APIMApiTrafficTrends';

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
const queryParamKey = 'trafficTrends';

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
 * Create React Component for APIM Api Traffic Trends widget
 * @class APIMApiTrafficTrendsWidget
 * @extends {Widget}
 */
class APIMApiTrafficTrendsWidget extends Widget {
    /**
     * Creates an instance of APIMApiTrafficTrendsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiTrafficTrendsWidget
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
            apiSelected: '',
            apiVersion: '',
            versionlist: [],
            versionMap: {},
            apilist: [],
            apiDataList: [],
            resultdata: [],
            apiFullData: [],
            resourceList: [],
            operationSelected: [],
            inProgress: true,
            proxyError: false,
            chartData: null,
            xAxisTicks: null,
            maxCount: 0,
            apiresource: null,
            apimethod: null,
            dataarray: [],
            legandDataSet: [],
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
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.apiOperationHandleChange = this.apiOperationHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
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
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMApiTrafficTrendsWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiTrafficTrends/locales/${locale}.json`)
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
     * Retrieve params from publisher - DateTimeRange
     * @param {object} receivedMsg timeFrom, TimeTo, perValue
     * @memberof APIMApiTrafficTrendsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMApiTrafficTrendsWidget
     * */
    resetState() {
        this.setState({
            inProgress: true,
            resultdata: [],
            chartData: null,
            xAxisTicks: null,
        });
        const queryParam = super.getGlobalState(queryParamKey);
        let {
            apiSelected, apiVersion, operationSelected,
        } = queryParam;
        const { apilist, versionMap } = this.state;
        let versions;

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

        this.setState({
            apiSelected, apiVersion, operationSelected, versionlist: versions,
        });
        this.setQueryParam(apiSelected, apiVersion, operationSelected);
    }

    /**
     * Get API list from Publisher
     * @memberof APIMApiTrafficTrendsWidget
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
     * @memberof APIMApiTrafficTrendsWidget
     * */
    handleApiListReceived(data) {
        const { id } = this.props;
        const { list } = data;
        if (list) {
            this.setState({ apiDataList: list });
        } else {
            this.setState({ inProgress: false });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiIdQuery();
    }

    /**
     * Formats the siddhi query - apiidquery
     * @memberof APIMApiTrafficTrendsWidget
     * */
    assembleApiIdQuery() {
        this.resetState();
        const { providerConfig, apiDataList } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            const apiList = [...apiDataList];
            let apiCondition = apiList.map((api) => {
                return '(API_NAME==\'' + api.name + '\' AND API_VERSION==\'' + api.version
                    + '\')';
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
            this.setState({ inProgress: false, resultdata: [] });
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiTrafficTrendsWidget
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
     * @memberof APIMApiTrafficTrendsWidget
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
                this.setState({ inProgress: false, resultdata: [] });
            }
        } else {
            this.setState({ inProgress: false, resultdata: [] });
        }
    }

    /**
     * Formats data retrieved from assembleResourceQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiTrafficTrendsWidget
     * */
    handleResourceReceived(message) {
        const { data } = message;
        const { id } = this.props;
        const { operationSelected } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;

        if (data) {
            const legenddata = [];
            const operations = [];
            const operationTypes = [];
            let method = '';
            const resourceList = [];

            data.forEach((dataUnit) => {
                resourceList.push([dataUnit[0] + ' (' + dataUnit[1]] + ')');
            });
            this.setState({ resourceList });

            if (operationSelected && operationSelected.length > 0) {
                operationSelected.forEach((element) => {
                    const resFormat = element.split(' (');
                    operations.push(resFormat[0]);
                    method = resFormat[1].replace(')', '');
                    operationTypes.push(method);
                });

                operations.forEach((element) => {
                    legenddata.push(
                        { name: element },
                    );
                });
                this.setState({ legandDataSet: legenddata });

                for (let index = 0; index < operations.length; index++) {
                    this.setQueryParam(apiSelected, apiVersion, operationSelected);
                    this.assembleMainQuery(operations[index], operationTypes[index]);
                }
            } else {
                this.setGlobalState({ inProgress: false });
                super.getWidgetChannelManager().unsubscribeWidget(id);
                this.assembleMainQuery('', '');
            }
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @param {string} apiresource - Selected Api Resource
     * @param {string} apimethod - Selected Api Method
     * @memberof APIMApiTrafficTrendsWidget
     * */
    assembleMainQuery(apiresource, apimethod) {
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;
        const {
            providerConfig, timeFrom, timeTo, perValue, operationSelected,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;

        if (apiSelected !== '' && apiVersion !== '' && (operationSelected.length > 0) && apiresource !== '') {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'resourcedata';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{apiName}}': apiSelected,
                '{{apiVersion}}': apiVersion,
                '{{apiResource}}': apiresource,
                '{{apiMethod}}': apimethod,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, dataarray: [] });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiTrafficTrendsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        let maxCount = 0;
        const { dataarray } = this.state;
        if (data && data.length !== 0) {
            const chartData = [];
            const xAxisTicks = [];

            data.forEach((dataUnit) => {
                chartData.push({
                    x: new Date(dataUnit[0]).getTime(),
                    y: dataUnit[1],
                    label: 'CREATED_TIME:'
                     + Moment(dataUnit[0]).format('YYYY-MMM-DD HH:mm:ss')
                     + '\nCOUNT:' + dataUnit[1],
                });
                maxCount += dataUnit[1];
            });

            const first = new Date(chartData[0].x).getTime();
            const last = new Date(chartData[chartData.length - 1].x).getTime();
            const interval = (last - first) / 10;
            let duration = 0;
            xAxisTicks.push(first);
            for (let i = 1; i <= 10; i++) {
                duration = interval * i;
                xAxisTicks.push(new Date(first + duration).getTime());
            }

            dataarray.push(chartData);
            this.setState({
                dataarray, inProgress: false, xAxisTicks, maxCount,
            });
        } else if (dataarray.length > 0) {
            this.setState({ inProgress: false });
        } else {
            this.setState({ inProgress: false, dataarray: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {string} operationSelected - Resources selected
     * @memberof APIMApiTrafficTrendsWidget
     * */
    setQueryParam(apiSelected, apiVersion, operationSelected) {
        super.setGlobalState(queryParamKey, {
            apiSelected,
            apiVersion,
            operationSelected,
        });
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiTrafficTrendsWidget
     * */
    apiSelectedHandleChange(event) {
        const { id } = this.props;
        this.setQueryParam(event.target.value, '', []);
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
     * @memberof APIMApiTrafficTrendsWidget
     * */
    apiVersionHandleChange(event) {
        const { apiSelected } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiSelected, event.target.value, []);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.setState({
            apiVersion: event.target.value,
            inProgress: true,
            resourceList: [],
        }, this.assembleResourceQuery);
    }

    /**
     * Handle operation select change
     * @param {Event} event - listened event
     * @memberof APIMApiTrafficTrendsWidget
     * */
    apiOperationHandleChange(event) {
        const { id } = this.props;
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            apiSelected, apiVersion, operationSelected,
        } = this.state;
        if (queryParam.operationSelected.includes(event.target.value)) {
            operationSelected.splice(operationSelected.indexOf(event.target.value), 1);
        } else {
            operationSelected.push(event.target.value);
        }

        const operations = [];
        const operationTypes = [];
        let method = '';
        const legenddata = [];

        operationSelected.forEach((element) => {
            const resFormat = element.split(' (');
            operations.push(resFormat[0]);
            method = resFormat[1].replace(')', '');
            operationTypes.push(method);
        });

        operations.forEach((element) => {
            legenddata.push(
                { name: element },
            );
        });
        this.setState({
            operationSelected, inProgress: true, dataarray: [], legandDataSet: legenddata,
        });
        this.setQueryParam(apiSelected, apiVersion, operationSelected);
        super.getWidgetChannelManager().unsubscribeWidget(id);

        for (let index = 0; index < operations.length; index++) {
            this.assembleMainQuery(operations[index], operationTypes[index]);
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Traffic Trends widget
     * @memberof APIMApiTrafficTrendsWidget
     */
    render() {
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            localeMessages, faultyProviderConfig, height, width,
            inProgress, proxyError, apiSelected, apiVersion, resultdata, apilist,
            versionlist, resourceList, chartData, xAxisTicks, maxCount, dataarray, legandDataSet,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const latencyProps = {
            themeName,
            queryParam,
            height,
            width,
            apiSelected,
            apiVersion,
            resultdata,
            apilist,
            versionlist,
            resourceList,
            inProgress,
            chartData,
            xAxisTicks,
            maxCount,
            dataarray,
            legandDataSet,
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
                                <Typography
                                    variant='h5'
                                    component='h3'
                                >
                                    <FormattedMessage
                                        id='apim.server.error.heading'
                                        defaultMessage='Error!'
                                    />
                                </Typography>
                                <Typography component='p'>
                                    { proxyError }
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
                                            <Typography
                                                variant='h5'
                                                component='h3'
                                            >
                                                <FormattedMessage
                                                    id='config.error.heading'
                                                    defaultMessage='Configuration Error !'
                                                />
                                            </Typography>
                                            <Typography component='p'>
                                                <FormattedMessage
                                                    id='config.error.body'
                                                    defaultMessage={'Cannot fetch provider configuration for APIM '
                                                    + 'Api Traffic Trends widget'}
                                                />
                                            </Typography>
                                        </Paper>
                                    </div>
                                ) : (
                                    <APIMApiTrafficTrends
                                        {...latencyProps}
                                        apiSelectedHandleChange={this.apiSelectedHandleChange}
                                        apiVersionHandleChange={this.apiVersionHandleChange}
                                        apiOperationHandleChange={this.apiOperationHandleChange}
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

global.dashboard.registerWidget('APIMApiTrafficTrends', APIMApiTrafficTrendsWidget);
