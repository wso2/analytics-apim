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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMApiResponse from './APIMApiResponse';

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
const queryParamKey = 'responsesummary';

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
 * Create React Component for APIM Api Response Summary widget
 * @class APIMApiResponseWidget
 * @extends {Widget}
 */
class APIMApiResponseWidget extends Widget {
    /**
     * Creates an instance of APIMApiResponseWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiResponseWidget
     */
    constructor(props) {
        super(props);
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
            apiCreatedBy: 'All',
            apiSelected: 'All',
            apiVersion: 'All',
            versionlist: [],
            apilist: [],
            responseData: [],
            localeMessages: null,
        };

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMApiResponseWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiResponseSummary/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMApiResponseWidget
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
     * @memberof APIMApiResponseWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { apiSelected } = queryParam;
        let { apiVersion } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected) {
            apiSelected = 'All';
        }
        if (!apiVersion) {
            apiVersion = 'All';
        }
        this.setState({ apiCreatedBy, apiSelected, apiVersion });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMApiResponseWidget
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
     * @memberof APIMApiResponseWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { apiCreatedBy, apiSelected, apiVersion } = this.state;
        const currentUser = super.getCurrentUser();

        if (data) {
            const apilist = ['All'];
            const versionlist = ['All'];

            if (apiCreatedBy === createdByKeys.All) {
                data.forEach((dataUnit) => {
                    if (!apilist.includes(dataUnit[0])) {
                        apilist.push(dataUnit[0]);
                    }
                    if (apiSelected === dataUnit[0]) {
                        versionlist.push(dataUnit[1]);
                    }
                });
            } else if (apiCreatedBy === createdByKeys.Me) {
                data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[2]) {
                        if (!apilist.includes(dataUnit[0])) {
                            apilist.push(dataUnit[0]);
                        }
                        if (apiSelected === dataUnit[0]) {
                            versionlist.push(dataUnit[1]);
                        }
                    }
                });
            }
            this.setState({ apilist, versionlist });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApiResponseWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, perValue, providerConfig, apilist,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;

        const apilistSliced = apilist.slice(1);
        const last = apilist.slice(-1)[0];
        let text = "apiName=='";
        apilistSliced.forEach((api) => {
            if (api !== last) {
                text += api + "' or apiName=='";
            } else {
                text += api + "' ";
            }
        });

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.mainquery;
        query = query
            .replace('{{timeFrom}}', timeFrom)
            .replace('{{timeTo}}', timeTo)
            .replace('{{per}}', perValue);

        if (apiSelected === 'All' && apiVersion === 'All') {
            query = query
                .replace('{{querystring}}', 'on (' + text + ')');
        } else if (apiSelected !== 'All' && apiVersion !== 'All') {
            query = query
                .replace('{{querystring}}', "on apiName=='{{api}}' AND apiVersion=='{{version}}'")
                .replace('{{api}}', apiSelected)
                .replace('{{version}}', apiVersion);
        } else {
            query = query
                .replace('{{querystring}}', "on apiName=='{{api}}'")
                .replace('{{api}}', apiSelected);
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiResponseWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { apiCreatedBy, apiSelected, apiVersion } = this.state;

        if (data) {
            const responseData = [];
            let other = 0;
            const dataUnit = message.data[0];
            if (dataUnit) {
                other = dataUnit[3] - (dataUnit[4] + dataUnit[5] + dataUnit[6]);
                responseData.push(dataUnit[3], dataUnit[4], dataUnit[5], dataUnit[6], other);
            } else {
                responseData.push(0, 0, 0, 0, 0);
            }

            this.setState({ responseData });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @memberof APIMApiResponseWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiResponseWidget
     * */
    apiCreatedHandleChange(event) {
        this.setQueryParam(event.target.value, 'All', 'All');
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiResponseWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy } = this.state;

        this.setQueryParam(apiCreatedBy, event.target.value, 'All');
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiResponseWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected } = this.state;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Response Summary widget
     * @memberof APIMApiResponseWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, apiCreatedBy, apiSelected,
            apiVersion, responseData, apilist, versionlist,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const responseProps = {
            themeName, height, width, apiCreatedBy, apiSelected, apiVersion, responseData, apilist, versionlist,
        };

        if (!localeMessages) {
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
                                             APIM Api Response Summary widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiResponse
                                {...responseProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiResponseSummary', APIMApiResponseWidget);
