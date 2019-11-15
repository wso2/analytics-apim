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
            apiCreatedBy: 'all',
            usageData: null,
            usageData1: null,
            apiIdMap: {},
            apiDataList: [],
            metadata: this.metadata,
            chartConfig: this.chartConfig,
            limit: 0,
            localeMessages: null,
            inProgress: true,
            proxyError: null,
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
        this.assembleApiSubQuery = this.assembleApiSubQuery.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleApiSubReceived = this.handleApiSubReceived.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.limitHandleChange = this.limitHandleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.getUsername = this.getUsername.bind(this);
        this.assembleApiIdQuery = this.assembleApiIdQuery.bind(this);
        this.handleApiIdReceived = this.handleApiIdReceived.bind(this);
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
        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'all';
        }
        if (!limit || limit < 0) {
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
        const { limit, apiCreatedBy } = queryParam;
        const {
            timeFrom, timeTo, perValue, providerConfig, username,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiusagequery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{apiCreator}}': apiCreatedBy !== 'all' ? 'AND apiCreator==\'{{username}}\'' : '',
            '{{username}}': username,
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{limit}}': limit
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiUsageReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiUsageQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const usageData = data.map(dataUnit => {
                return {
                    apiname: dataUnit[0],
                    provider: dataUnit[1],
                    hits: dataUnit[2]
                }
            });
            this.setState({ usageData });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Retrieve API list from APIM server
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiListQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.setState({ proxyError: null });
                this.handleApiListReceived(response.data);
            })
            .catch(error => {
                if (error.response && error.response.data) {
                    let proxyError = error.response.data;
                    proxyError = proxyError.split(':').splice(1).join('').trim();
                    this.setState({ proxyError, inProgress: false });
                }
                console.error(error);
            });
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} data - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiListReceived(data) {
        const { list } = data;
        const { id } = this.props;

        if (list) {
            this.setState({ apiDataList: list });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiIdQuery();
    }

    /**
     * Formats the siddhi query - apiidquery
     * @memberof APIMOverallApiUsageWidget
     * */
    assembleApiIdQuery() {
        this.resetState();
        const { providerConfig, apiDataList } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            let apiCondition = apiDataList.map(api => {
                return '(API_NAME==\'' + api.name + '\' AND API_VERSION==\'' + api.version
                    + '\' AND API_PROVIDER==\'' + api.provider + '\')';
            });
            apiCondition = apiCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiidquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiIdReceived, dataProviderConfigs);
        } else {
            this.setState({ usageData1: [], inProgress: false  });
        }
    }

    /**
     * Formats data retrieved from assembleApiIdQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiUsageWidget
     * */
    handleApiIdReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const apiIdMap = {};
            data.map(api => { apiIdMap[api[0]]= { apiname: api[1], creator: api[2] }; });
            this.setState({ apiIdMap });
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
        const { providerConfig, apiIdMap } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIdMap && Object.keys(apiIdMap).length > 0) {
            let apiIds = Object.keys(apiIdMap).map(id => { return 'API_ID==' + id });
            apiIds = apiIds.join(' OR ');
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apisubquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}' : apiIds
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiSubReceived, dataProviderConfigs);
        } else {
            this.setState({ usageData1: [], inProgress: false  });
        }
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
                usageData, apiIdMap,
            } = this.state;

            const usageData1 = [];
            data.map(dataUnit => {
                const { apiname, creator } = apiIdMap[dataUnit[0]];
                const hits = usageData.filter(usage => usage.apiname === apiname && usage.provider === creator);

                if (hits.length > 0) {
                    usageData1.push([hits[0].apiname, hits[0].provider, hits[0].hits, dataUnit[1]]);
                }
            });
            this.setState({ usageData1, inProgress: false  });
        } else {
            this.setState({ usageData1: [], inProgress: false  });
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

        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(apiCreatedBy, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleApiUsageQuery();
        } else {
            this.setState({ limit });
        }
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
        this.setState({ inProgress: true });
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
            localeMessages, faultyProviderConfig, width, height, limit, apiCreatedBy, usageData1, metadata, chartConfig,
            inProgress, proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const ovearllUsageProps = {
            themeName, width, height, limit, apiCreatedBy, usageData1, metadata, chartConfig, inProgress,
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
                                        defaultMessage='Error!' />
                                </Typography>
                                <Typography component='p'>
                                    { proxyError }
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
                                            + 'Overall Api Usage widget'}
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
