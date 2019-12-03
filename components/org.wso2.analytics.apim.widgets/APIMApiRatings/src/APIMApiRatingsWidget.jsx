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
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
import APIMApiRatings from './APIMApiRatings';

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
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for APIM Api Ratings
 * @class APIMApiRatingsWidget
 * @extends {Widget}
 */
class APIMApiRatingsWidget extends Widget {
    /**
     * Creates an instance of APIMApiRatingsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiRatingsWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            topApiIdData: [],
            topApiNameData: [],
            apiDataList: [],
            localeMessages: null,
            inProgress: true,
            proxyError: null,
            refreshInterval: 60000, // 1min
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

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleAPIDataQuery = this.assembleAPIDataQuery.bind(this);
        this.assembleTopAPIQuery = this.assembleTopAPIQuery.bind(this);
        this.handleAPIDataReceived = this.handleAPIDataReceived.bind(this);
        this.handleTopAPIReceived = this.handleTopAPIReceived.bind(this);
        this.assembleAPIListQuery = this.assembleAPIListQuery.bind(this);
        this.handleAPIListReceived = this.handleAPIListReceived.bind(this);
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
        const { refreshInterval } = this.state;

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refreshIntervalId = setInterval(this.assembleAPIListQuery, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                    refreshIntervalId,
                }, this.assembleAPIListQuery);
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
        const { refreshIntervalId } = this.state;

        clearInterval(refreshIntervalId);
        this.setState({ refreshIntervalId: null });
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMApiRatingsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiRatings/locales/${locale}.json`)
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
     * Get API list from publisher
     * @memberof APIMApiRatingsWidget
     * */
    assembleAPIListQuery() {
        this.resetState();
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.setState({ proxyError: null });
                this.handleAPIListReceived(response.data);
            })
            .catch((error) => {
                if (error.response && error.response.data) {
                    let proxyError = error.response.data;
                    proxyError = proxyError.split(':').splice(1).join('').trim();
                    this.setState({ proxyError, inProgress: false });
                }
                console.error(error);
            });
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} data - data retrieved
     * @memberof APIMApiRatingsWidget
     * */
    handleAPIListReceived(data) {
        const { list } = data;
        const { id } = this.props;
        if (list) {
            this.setState({ apiDataList: list });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleAPIDataQuery()
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMApiRatingsWidget
     * */
    assembleAPIDataQuery() {
        const { providerConfig, apiDataList } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiDataList && apiDataList.length > 0) {
            let apiCondition = apiDataList.map(api => {
                return '(API_NAME==\'' + api.name + '\' AND API_VERSION==\'' + api.version
                    + '\' AND API_PROVIDER==\'' + api.provider + '\')';
            });
            apiCondition = apiCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apilistquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiCondition}}': apiCondition
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAPIDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, topApiNameData: [] })
        }
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiRatingsWidget
     * */
    handleAPIDataReceived(message) {
        const { data } = message;
        const { id } = this.props;
        if (data) {
            const apiIdMap = {};
            data.map(api => { apiIdMap[api[0]]= api; });
            this.setState({ apiIdMap });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTopAPIQuery()
    }

    /**
     * Formats the siddhi query - topapiquery
     * @memberof APIMApiRatingsWidget
     * */
    assembleTopAPIQuery() {
        const { providerConfig, apiIdMap } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIdMap && Object.keys(apiIdMap).length > 0) {
            let apiIds = Object.keys(apiIdMap).map(id => { return 'API_ID==' + id });
            apiIds = apiIds.join(' OR ');
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'topapiquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}': apiIds
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleTopAPIReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, topApiNameData: [] })
        }
    }

    /**
     * Formats data received from assembleTopAPIQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiRatingsWidget
     * */
    handleTopAPIReceived(message) {
        const { data } = message;

        if (data) {
            const { apiIdMap } = this.state;
            const topApiNameData = data.map(dataUnit => {
                const api = apiIdMap[dataUnit[0]];
                return {
                    apiname: api[1] + ' (' + api[3] + ')',
                    ratings: dataUnit[1],
                };
            });
            this.setState({ topApiNameData, inProgress: false });
        } else {
            this.setState({ topApiNameData: [], inProgress: false });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Ratings widget
     * @memberof APIMApiRatingsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, availableApiData, legendData, topApiNameData, inProgress,
            proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiRatingProps = {
            themeName, height, availableApiData, legendData, topApiNameData, inProgress,
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
                                        defaultMessage='Error!' />
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
                                                    + 'Api Ratings widget'}
                                                />
                                            </Typography>
                                        </Paper>
                                    </div>
                                ) : (
                                    <APIMApiRatings {...apiRatingProps} />
                                )
                            }
                        </div>
                    )}

                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiRatings', APIMApiRatingsWidget);
