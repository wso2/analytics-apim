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
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMGeoInvocations from './APIMGeoInvocations';

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
const queryParamKey = 'geoInvocations';

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
 * Create React Component for APIM Geo Based Invocations widget
 * @class APIMGeoInvocationsWidget
 * @extends {Widget}
 */
class APIMGeoInvocationsWidget extends Widget {
    /**
     * Creates an instance of APIMGeoInvocationsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMGeoInvocationsWidget
     */
    constructor(props) {
        super(props);

        this.chartConfig = {
            x: 'Country',
            charts: [
                {
                    type: 'map',
                    y: 'count',
                    mapType: 'world',
                    colorScale: [
                        '#1565C0',
                        '#4DB6AC',
                    ],
                },
            ],
            chloropethRangeUpperbound: [20],
            chloropethRangeLowerbound: [0],
        };

        this.metadata = {
            names: ['Country', 'count'],
            types: ['ordinal', 'linear'],
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
            apiCreatedBy: 'All',
            apiSelected: '',
            apiVersion: '',
            versionlist: null,
            apilist: null,
            geoData: null,
            metadata: this.metadata,
            chartConfig: this.chartConfig,
        };

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
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
     * @memberof APIMGeoInvocationsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMGeoBasedInvocations/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
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
            apiSelected = '';
        }
        if (!apiVersion) {
            apiVersion = '';
        }
        this.setState({ apiCreatedBy, apiSelected, apiVersion });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const queryParam = super.getGlobalState(queryParamKey);
        const { id } = this.props;
        let { apiCreatedBy } = queryParam;
        let { apiSelected } = queryParam;
        let { apiVersion } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected) {
            [[, apiSelected]] = data;
        }
        if (!apiVersion) {
            [[,, apiVersion]] = data;
        }

        if (data) {
            const currentUser = super.getCurrentUser();
            const apilist = [];
            const versionlist = [];

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
                apiCreatedBy, apiSelected, apiVersion, apilist, versionlist,
            });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMGeoInvocationsWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            providerConfig, timeFrom, timeTo, perValue,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion } = queryParam;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.mainquery;
        query = query
            .replace('{{timeFrom}}', timeFrom)
            .replace('{{timeTo}}', timeTo)
            .replace('{{per}}', perValue);
        if (apiSelected !== '' && apiVersion !== '') {
            query = query
                .replace('{{querystring}}', "on apiName=='{{api}}' AND apiVersion=='{{version}}'")
                .replace('{{api}}', apiSelected)
                .replace('{{version}}', apiVersion);
        } else {
            query = query
                .replace('{{querystring}}', '');
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMGeoInvocationsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const { apiCreatedBy, apiSelected, apiVersion } = this.state;
            this.setState({ geoData: data });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
     * */
    apiCreatedHandleChange(event) {
        const { id } = this.props;
        this.setQueryParam(event.target.value, '', '');
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMGeoInvocationsWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value, '');
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMGeoInvocationsWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Geo Based Invocations widget
     * @memberof APIMGeoInvocationsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width, apiCreatedBy,
            apiSelected, apiVersion, geoData, apilist, versionlist,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const geoProps = {
            themeName,
            chartConfig,
            metadata,
            height,
            width,
            apiCreatedBy,
            apiSelected,
            apiVersion,
            geoData,
            apilist,
            versionlist,
        };

        if (!localeMessages || !geoData) {
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
                                             APIM Geo Based Invocations widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMGeoInvocations
                                {...geoProps}
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

global.dashboard.registerWidget('APIMGeoBasedInvocations', APIMGeoInvocationsWidget);
