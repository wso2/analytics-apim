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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMTopAgents from './APIMTopAgents';

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
const queryParamKey = 'userAgents';

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
 * Create React Component for APIM Top User Agents widget
 * @class APIMTopAgentsWidget
 * @extends {Widget}
 */
class APIMTopAgentsWidget extends Widget {
    /**
     * Creates an instance of APIMTopAgentsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopAgentsWidget
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
            limit: 0,
            apiCreatedBy: 'All',
            apiSelected: 'All',
            apiVersion: 'All',
            versionlist: [],
            versionMap: {},
            apilist: [],
            legendData: null,
            agentData: null,
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

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
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
     * @memberof APIMTopAgentsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMTopUserAgents/locales/${locale}.json`)
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
     * @memberof APIMTopAgentsWidget
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
     * @memberof APIMTopAgentsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy, apiSelected, apiVersion, limit } = queryParam;
        const { versionMap, apilist } = this.state;
        let versions;

        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected || (apilist && !apilist.includes(apiSelected))) {
            apiSelected = 'All';
            apiVersion = 'All';
        }
        if (versionMap && apiSelected in versionMap) {
            versions = versionMap[apiSelected];
        } else {
            versions = [];
        }
        if (!apiVersion || (versions && !versions.includes(apiVersion))) {
            apiVersion = 'All';
        }
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setState({
            apiCreatedBy, apiSelected, apiVersion, limit, versionlist: versions,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMTopAgentsWidget
     * */
    assembleApiListQuery() {
        this.resetState();
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
     * @memberof APIMTopAgentsWidget
     * */
    handleApiListReceived(data) {
        let { list } = data;
        const { id } = this.props;
        const { username } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy  } = queryParam;

        if (list && list.length > 0) {
            if (apiCreatedBy !== 'All') {
                list = list.filter((dataUnit) =>  dataUnit.provider === username );
            }

            let apilist = [];
            const versionMap = {};
            list.forEach((dataUnit) => {
                apilist.push(dataUnit.name);
                // retrieve all entries for the api and get the api versions list
                const versions = list.filter(d => d.name === dataUnit.name);
                const versionlist = versions.map(ver => { return ver.version; });
                versionlist.unshift('All');
                versionMap[dataUnit.name] = versionlist;
            });
            versionMap['All'] = ['All'];
            apilist = [...new Set(apilist)];
            apilist.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            apilist.unshift('All');
            this.setState({ apilist, versionMap });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMTopAgentsWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, perValue, providerConfig, apilist,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion, limit } = queryParam;
        const { id, widgetID: widgetName } = this.props;

        if (apilist && apilist.length > 0) {
            let queryString = '';
            if (apiSelected === 'All' && apiVersion === 'All') {
                let apis = apilist.slice(1).map(api => { return 'apiName==\'' + api + '\''});
                apis = apis.join(' OR ');
                queryString = 'AND (' + apis + ')';
            } else if (apiSelected !== 'All' && apiVersion !== 'All') {
                queryString = 'AND apiName==\'' + apiSelected + '\' AND apiVersion==\'' + apiVersion + '\'';
            } else {
                queryString = 'AND apiName==\'' + apiSelected + '\'';
            }

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
                '{{querystring}}': queryString
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, agentData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopAgentsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, limit,
        } = this.state;

        if (data) {
            const agentData = [];
            const legendData = [];
            data.forEach((dataUnit) => {
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
                agentData.push({
                    agent: dataUnit[0],
                    reqCount: dataUnit[1]
                });
            });

            this.setState({ legendData, agentData, inProgress: false });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
        } else {
            this.setState({ inProgress: false, agentData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMTopAgentsWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
            limit,
        });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMTopAgentsWidget
     * */
    handleLimitChange(event) {
        const { id } = this.props;
        const { apiCreatedBy, apiSelected, apiVersion } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopAgentsWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, 'All', 'All', limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopAgentsWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value, 'All', limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopAgentsWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value, limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top User Agents widget
     * @memberof APIMTopAgentsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, apiSelected, apiVersion, inProgress,
            legendData, agentData, apilist, versionlist, proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const agentsProps = {
            themeName,
            height,
            limit,
            apiCreatedBy,
            apiSelected,
            apiVersion,
            legendData,
            agentData,
            apilist,
            versionlist,
            inProgress,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM'
                                            + ' Top User Agents widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMTopAgents
                                {...agentsProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopUserAgents', APIMTopAgentsWidget);
