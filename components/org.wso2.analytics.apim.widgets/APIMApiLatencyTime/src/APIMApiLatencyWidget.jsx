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
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import Moment from 'moment';
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
            versionMap: {},
            apilist: [],
            apiDataList: [],
            latencyData: null,
            apiFullData: [],
            resourceList: [],
            resSelected: [],
            inProgress: true,
            metadata: this.metadata,
            chartConfig: this.chartConfig,
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
        this.apiResourceHandleChange = this.apiResourceHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getUsername = this.getUsername.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
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
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiLatencyTime/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
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
        let {
            apiCreatedBy, apiSelected, apiVersion, resSelected
        } = queryParam;
        const { apilist, versionMap } = this.state;
        let vesions;
        let vesionsMap = { ...versionMap };

        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected || !apilist.includes(apiSelected)) {
            if (apilist.length > 0) {
                apiSelected = apilist[0];
            }
        }
        if (apiSelected in vesionsMap) {
            vesions = vesionsMap[apiSelected];
        } else {
            vesions = [];
        }
        if (!apiVersion || !vesions.includes(apiVersion)) {
            if (vesions.length > 0) {
                apiVersion = vesions[0];
            } else {
                apiVersion = '';
            }
        }
        if (!resSelected) {
            resSelected = [];
        }
        this.setState({
            apiCreatedBy, apiSelected, apiVersion, resSelected, versionlist: vesions, vesionMap: vesionsMap
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
    }

    /**
     * Get API list from Publisher
     * @memberof APIMApiLatencyWidget
     * */
    assembleApiListQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.handleApiListReceived(response.data);
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} data - data retrieved
     * @memberof APIMApiLatencyWidget
     * */
    handleApiListReceived(data) {
        const { id } = this.props;
        const { list } = data;
        if (list) {
            this.setState({ apiDataList: list });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiIdQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMApiLatencyWidget
     * */
    assembleApiIdQuery() {
        this.resetState();
        const { providerConfig, apiDataList, apiCreatedBy, username } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            let apiCondition;

            if (apiCreatedBy !== "All") {
                apiCondition = 'CREATED_BY==\'' + username + '\'';
            } else {
                apiCondition = apiDataList.map(api => {
                    return '(API_NAME==\'' + api.name + '\' AND API_VERSION==\'' + api.version
                        + '\' AND CREATED_BY==\'' + api.provider + '\')';
                });
                apiCondition = apiCondition.join(' OR ');
            }
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition
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
        let { apiSelected } = queryParam;
        const { data } = message;

        if (data && data.length > 0) {
            let apilist = [];
            const versionMap = {};
            data.forEach((dataUnit) => {
                apilist.push(dataUnit[1]);
                // retrieve all entries for the api and get the api versions list
                const versions = data.filter(d => d[1] === dataUnit[1]);
                const versionlist = versions.map(ver => { return ver[2]; });
                versionMap[dataUnit[1]] = versionlist;
            });
            apilist = [...new Set(apilist)];
            apilist.sort();
            this.setState({ apilist, versionMap, apiFullData: data, apiSelected });
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
        const { providerConfig, apiFullData, apiSelected, apiVersion } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiFullData && apiFullData.length > 0) {
            const api = apiFullData.filter(apiData => apiSelected === apiData[1] && apiVersion === apiData[2])[0];

            if (api) {
                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'resourcequery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{apiID}}': api[0]
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
        const {
            providerConfig, timeFrom, timeTo, perValue, resSelected, apiSelected, apiVersion,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';

        if (apiSelected !== '' && apiVersion !== '' && resSelected.length > 0) {
            let resources = resSelected.map(res => {
                const resFormat = res.split(' (');
                const resource = resFormat[0];
                const method = resFormat[1].replace(')', '');
                return '(apiResourceTemplate==\'' + resource + '\' AND apiMethod==\'' + method + '\')';
            });
            resources = resources.join (' OR ');
            const queryCondition = ' AND (apiName==\'' + apiSelected + '\' AND apiVersion==\''
                + apiVersion + '\' AND (' + resources + '))';

            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{querystring}}': queryCondition,
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
                apiCreatedBy, apiSelected, apiVersion, resSelected,
            } = this.state;
            const latencyData = data.map((dataUnit) => {
                return ([dataUnit[0], dataUnit[1], dataUnit[2], dataUnit[3], dataUnit[4],
                    dataUnit[5], dataUnit[6], Moment(dataUnit[7]).format('YYYY-MMM-DD HH:mm:ss')]);
            });
            this.setState({ latencyData, inProgress: false });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
        } else {
            this.setState({ inProgress: false, latencyData: [] });
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
        this.setState({ apiSelected: event.target.value, versionlist: [], inProgress: true },
            this.assembleResourceQuery);
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
     * Handle Resources select change
     * @param {Event} event - listened event
     * @memberof APIMApiLatencyWidget
     * */
    apiResourceHandleChange(event) {
        const { id } = this.props;
        const queryParam = super.getGlobalState(queryParamKey);
        const {
            apiCreatedBy, apiSelected, apiVersion, resSelected,
        } = this.state;
        if (queryParam.resSelected.includes(event.target.value)) {
            resSelected.splice(resSelected.indexOf(event.target.value), 1);
        } else {
            resSelected.push(event.target.value);
        }
        this.setState({ resSelected , inProgress: true });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, resSelected);
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
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width, inProgress,
            apiCreatedBy, apiSelected, apiVersion, latencyData, apilist, versionlist, resourceList,
        } = this.state;
        const {
            paper, paperWrapper,
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
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
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
