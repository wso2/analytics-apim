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
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
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

const queryParamKey = 'overallapiusage';
const API_USAGE_CALLBACK = '-api-usage';
const API_ID_CALLBACK = '-api-id';
const API_SUB_CALLBACK = '-api-sub';

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
            apiCreatedBy: 'all',
            usageData: null,
            usageData1: null,
            usageData2: null,
            apiIdMap: {},
            apiIdMapGlobal: {},
            limit: 5,
            localeMessages: null,
            inProgress: true,
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

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiSubQuery = this.assembleApiSubQuery.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiSubReceived = this.handleApiSubReceived.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.limitHandleChange = this.limitHandleChange.bind(this);
        this.assembleApiIdQuery = this.assembleApiIdQuery.bind(this);
        this.handleApiIdReceived = this.handleApiIdReceived.bind(this);
        this.selectedAPIChangeCallback = this.selectedAPIChangeCallback.bind(this);
        this.loadLimit = this.loadLimit.bind(this);
        this.handleOnClickAPI = this.handleOnClickAPI.bind(this);
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
        this.loadLimit();

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
        super.getWidgetChannelManager().unsubscribeWidget(id + API_SUB_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + API_USAGE_CALLBACK);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMOverallApiUsageWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiUsage/locales/${locale}.json`)
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
     * @memberof APIMOverallApiUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
            from, to, granularity, dm, op,
        } = receivedMsg;

        if (dm && from) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleApiUsageQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleApiUsageQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleApiUsageQuery);
        }
    }

    /**
     * Retrieve the limit from query param
     * @memberof APIMOverallApiUsageWidget
     * */
    loadLimit() {
        let { limit } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setQueryParam(limit);
        this.setState({ limit });
    }

    /**
     * Formats the siddhi query - apiusagequery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiUsageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, dimension, selectedOptions, limit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0 && limit > 0) {
                let filterCondition = '';
                if (selectedOptions[0].name !== 'All') {
                    filterCondition = selectedOptions.map((opt) => {
                        return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
                    });
                    filterCondition = filterCondition.join(' OR ');
                    filterCondition = 'AND ' + filterCondition;
                }

                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'apiusagequery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{filterCondition}}': filterCondition,
                    '{{from}}': timeFrom,
                    '{{to}}': timeTo,
                    '{{per}}': perValue,
                    '{{limit}}': limit,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id + API_USAGE_CALLBACK, widgetName, this.handleApiUsageReceived,
                        dataProviderConfigs);
            } else {
                this.setState({
                    usageData1: [], usageData2: [], inProgress: false,
                });
            }
        }
    }

    /**
     * Formats data retrieved from assembleApiUsageQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const usageData = data.map((dataUnit) => {
                return {
                    apiname: dataUnit[0],
                    provider: dataUnit[1],
                    hits: dataUnit[2],
                    version: dataUnit[3],
                };
            });
            this.setState({ usageData }, this.assembleApiIdQuery);
        } else {
            this.setState({
                usageData1: [], usageData2: [], inProgress: false,
            });
        }
    }

    /**
     * Formats the siddhi query - apiidquery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiIdQuery() {
        const { providerConfig, usageData } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (usageData && usageData.length > 0) {
            let apiCondition = usageData.map((api) => {
                return '(API_NAME==\'' + api.apiname + '\' AND API_VERSION==\'' + api.version
                    + '\' AND API_PROVIDER==\'' + api.provider + '\')';
            });
            apiCondition = apiCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + API_ID_CALLBACK, widgetName, this.handleApiIdReceived, dataProviderConfigs);
        } else {
            this.setState({
                usageData1: [], usageData2: [], inProgress: false,
            });
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiIdReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const apiIdMap = {};
            data.forEach((api) => { apiIdMap[api[0]] = { apiname: api[1], creator: api[2], version: api[3] }; });
            this.setState({ apiIdMapGlobal: cloneDeep(apiIdMap), apiIdMap }, this.assembleApiSubQuery);
        } else {
            this.setState({
                usageData1: [], usageData2: [], inProgress: false,
            });
        }
    }

    /**
     * Formats the siddhi query - apisubquery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiSubQuery() {
        const { providerConfig, apiIdMap } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIdMap && Object.keys(apiIdMap).length > 0) {
            let apiIds = Object.keys(apiIdMap).map((apiId) => { return 'API_ID==' + apiId; });
            apiIds = apiIds.join(' OR ');
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apisubquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}': apiIds,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + API_SUB_CALLBACK, widgetName, this.handleApiSubReceived, dataProviderConfigs);
        } else {
            this.setState({
                usageData1: [], usageData2: [], inProgress: false,
            });
        }
    }

    /**
     * Formats data retrieved from assembleApiSubQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiSubReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const {
                usageData, apiIdMap, apiIdMapGlobal,
            } = this.state;
            const usageData1 = [];
            const usageData2 = [];
            usageData.forEach((dataUnit) => {
                const {
                    apiname, provider, version, hits,
                } = dataUnit;
                const idArray = Object.keys(apiIdMapGlobal);
                const apiID = idArray.find(id => apiIdMapGlobal[id].apiname === apiname
                    && apiIdMapGlobal[id].creator === provider && apiIdMapGlobal[id].version === version);
                if (apiID) {
                    let subCount = data.reduce((result, item) => {
                        const [aID, count] = item;
                        // comparision === isn't done because this compares a string with an int
                        if (aID == apiID) {
                            result = count;
                        }
                        return result;
                    }, null);
                    if (!subCount) {
                        subCount = 0;
                    }
                    if (apiIdMap[apiID]) {
                        usageData1.push(
                            [apiname, provider, hits, subCount, version],
                        );
                    } else {
                        usageData2.push(
                            [apiname, provider, hits, subCount, version],
                        );
                    }
                }
            });
            this.setState({
                usageData1,
                usageData2: [...usageData1, ...usageData2],
                inProgress: false,
            });
        } else {
            this.setState({
                usageData1: [], usageData2: [], inProgress: false,
            });
        }
    }

    /**
     * Updates query param values
     * @param {string} limit - limit menu option selected
     * @memberof APIMOverallApiUsageWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle limit menu select change
     * @param {Event} event - listened event
     * @memberof APIMOverallApiUsageWidget
     * */
    limitHandleChange(event) {
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleApiUsageQuery);
        } else {
            this.setState({ limit });
        }
    }

    selectedAPIChangeCallback = (selectedAPI) => {
        const { usageData1, apiIdMap, apiIdMapGlobal } = this.state;
        const usage = cloneDeep(usageData1);
        const idMap = cloneDeep(apiIdMap);
        let found = false;
        const keys = Object.keys(idMap);
        for (const i in keys) {
            if (idMap[keys[i]].apiname === selectedAPI[0] && idMap[keys[i]].creator === selectedAPI[1]
                && idMap[keys[i]].version === selectedAPI[4]) {
                delete idMap[keys[i]];
                found = true;
                usage.splice(usage.findIndex(e => (e[0] === selectedAPI[0]) && (e[1] === selectedAPI[1])
                    && (e[4] === selectedAPI[4])), 1);
                break;
            }
        }
        if (!found) {
            const keysglobal = Object.keys(apiIdMapGlobal);
            let idOfApi = 0;
            for (const i in keysglobal) {
                if (apiIdMapGlobal[keysglobal[i]].apiname === selectedAPI[0]
                    && apiIdMapGlobal[keysglobal[i]].creator === selectedAPI[1]
                    && apiIdMapGlobal[keysglobal[i]].version === selectedAPI[4]) {
                    idOfApi = keysglobal[i];
                    break;
                }
            }
            idMap[idOfApi] = { apiname: selectedAPI[0], creator: selectedAPI[1], version: selectedAPI[4] };
            usage.push(selectedAPI);
        }
        this.setState({ usageData1: usage, apiIdMap: idMap });
    };

    /**
     * Handle onClick of an API and drill down
     * @memberof APIMOverallApiUsageWidget
     * */
    handleOnClickAPI(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const {
                    tr, sd, ed, g,
                } = super.getGlobalState('dtrp');
                const { apiname, apiversion } = data;
                const api = (apiname.split(' (')[0]).trim();
                const provider = (apiname.split('(')[1]).split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];
                const queryParams = {
                    dtrp: {
                        tr,
                        sd,
                        ed,
                        g,
                    },
                    dmSelc: {
                        dm: 'api',
                        op: [{ name: api, version: apiversion, provider }],
                    },
                };
                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '?widgetStates='
                    + encodeURI(JSON.stringify(queryParams));
            }
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Api Usage widget
     * @memberof APIMOverallApiUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, width, height, limit, usageData1, usageData2, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const ovearllUsageProps = {
            themeName, width, height, limit, usageData1, usageData2, inProgress, username,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Overall Api Usage widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMOverallApiUsage
                                {...ovearllUsageProps}
                                limitHandleChange={this.limitHandleChange}
                                selectedAPIChangeCallback={this.selectedAPIChangeCallback}
                                handleOnClickAPI={this.handleOnClickAPI}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiUsage', APIMOverallApiUsageWidget);
