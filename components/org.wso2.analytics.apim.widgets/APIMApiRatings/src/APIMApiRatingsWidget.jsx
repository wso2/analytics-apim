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
 * Callback suffixes
 * */
const API_ID_CALLBACK = '-api-id';
const API_RATING_CALLBACK = '-rating';

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
            apiIdMap: null,
            localeMessages: null,
            inProgress: true,
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
        const { refreshInterval } = this.state;

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refreshIntervalId = setInterval(this.assembleAPIDataQuery, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                    refreshIntervalId,
                }, this.assembleAPIDataQuery);
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
        super.getWidgetChannelManager().unsubscribeWidget(id + API_ID_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + API_RATING_CALLBACK);
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
     * Formats the siddhi query - apilistquery
     * @memberof APIMApiRatingsWidget
     * */
    assembleAPIDataQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apilistquery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + API_ID_CALLBACK, widgetName, this.handleAPIDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiRatingsWidget
     * */
    handleAPIDataReceived(message) {
        const { data } = message;
        if (data && data.length > 0) {
            const apiIdMap = {};
            data.forEach((api) => { apiIdMap[api[0]] = api; });
            this.setState({ apiIdMap }, this.assembleTopAPIQuery);
        } else {
            this.setState({ inProgress: false, topApiNameData: [] });
        }
    }

    /**
     * Formats the siddhi query - topapiquery
     * @memberof APIMApiRatingsWidget
     * */
    assembleTopAPIQuery() {
        const { providerConfig, apiIdMap } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (apiIdMap && Object.keys(apiIdMap).length > 0) {
            let apiIds = Object.keys(apiIdMap).map((apiId) => { return 'API_ID==' + apiId; });
            apiIds = apiIds.join(' OR ');
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'topapiquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiList}}': apiIds,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + API_RATING_CALLBACK, widgetName, this.handleTopAPIReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, topApiNameData: [] });
        }
    }

    /**
     * Formats data received from assembleTopAPIQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiRatingsWidget
     * */
    handleTopAPIReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const { apiIdMap } = this.state;
            const topApiNameData = data.map((dataUnit) => {
                const api = apiIdMap[dataUnit[0]];
                return {
                    apiname: api[1] + ' (' + api[3] + ')',
                    apiversion: api[2],
                    ratings: dataUnit[1],
                };
            });
            this.setState({ topApiNameData, inProgress: false });
        } else {
            this.setState({ topApiNameData: [], inProgress: false });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof APIMApiRatingsWidget
     * */
    handleOnClickAPI(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const { apiname, apiversion } = data;
                const api = (apiname.split(' (')[0]).trim();
                const provider = (apiname.split('(')[1]).split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];

                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '#{"dmSelc":{"dm":"api","op":[{"name":"'
                    + api + '","version":"' + apiversion + '","provider":"' + provider + '"}]}}';
            }
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
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiRatingProps = {
            themeName, height, availableApiData, legendData, topApiNameData, inProgress,
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
                                            + 'Api Ratings widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiRatings
                                {...apiRatingProps}
                                handleOnClickAPI={this.handleOnClickAPI}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiRatings', APIMApiRatingsWidget);
