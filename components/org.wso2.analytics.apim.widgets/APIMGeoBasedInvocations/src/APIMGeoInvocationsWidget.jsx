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
            names: ['count', 'Country'],
            types: ['linear', 'ordinal'],
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
            apiCreatedBy: 'All',
            apiSelected: '',
            apiVersion: '',
            versionlist: [],
            apilist: [],
            geoData: null,
            inProgress: true,
            metadata: this.metadata,
            chartConfig: this.chartConfig,
            proxyError: false,
            username: '',
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
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
        this.getUsername = this.getUsername.bind(this);
        this.setchloropethRangeUpperbound = this.setchloropethRangeUpperbound.bind(this);
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
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMGeoInvocationsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMGeoBasedInvocations/locales/${locale}.json`)
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
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let {
            apiCreatedBy, apiSelected, apiVersion,
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

        this.setState({
            apiCreatedBy, apiSelected, apiVersion, versionlist: versions,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
     * */
    handleApiListReceived(data) {
        let { list } = data;
        const { id } = this.props;
        const { username } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        if (list && list.length > 0) {
            if (apiCreatedBy !== 'All') {
                list = list.filter((api) => { return api.provider === username; });
            }

            let apilist = [];
            const versionMap = {};
            list.forEach((dataUnit) => {
                apilist.push(dataUnit.name);
                // retrieve all entries for the api and get the api versions list
                const versions = list.filter(d => d.name === dataUnit.name);
                const versionlist = versions.map((ver) => { return ver.version; });
                versionMap[dataUnit.name] = versionlist;
            });
            apilist = [...new Set(apilist)];
            apilist.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            this.setState({ apilist, versionMap });
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
        const widgetName = this.props.widgetID;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';
        if (apiSelected !== '' && apiVersion !== '') {
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{querystring}}': "AND apiName=='{{api}}' AND apiVersion=='{{version}}'",
                '{{api}}': apiSelected,
                '{{version}}': apiVersion,
            };
        } else {
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{per}}': perValue,
                '{{querystring}}': '',
            };
        }
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
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
            this.setchloropethRangeUpperbound(data);
            this.setState({ geoData: data, inProgress: false });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion);
        } else {
            this.setState({ inProgress: false, geoData: [] });
        }
    }

    /**
     * Sets the upper bound for geochart range
     * @param {object} data - data for the geochart
     * @memberof APIMGeoInvocationsWidget
     */
    setchloropethRangeUpperbound(data) {
        let maxCount = 1;
        if (data.length > 0) {
            data.map((dataPoint) => {
                if (dataPoint[0] > maxCount) {
                    maxCount = dataPoint[0];
                }
            });
            this.chartConfig.chloropethRangeUpperbound = [maxCount];
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
        this.setState({ inProgress: true });
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
        this.setState({ inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
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
        this.setState({ inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Geo Based Invocations widget
     * @memberof APIMGeoInvocationsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width, apiCreatedBy, inProgress,
            apiSelected, apiVersion, geoData, apilist, versionlist, proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaperWrapper, proxyPaper,
        } = this.styles;
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
                                                    defaultMessage={'Cannot fetch provider configuration for APIM Geo '
                                                    + 'Based Invocations widget'}
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
                        </div>
                    ) }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMGeoBasedInvocations', APIMGeoInvocationsWidget);
