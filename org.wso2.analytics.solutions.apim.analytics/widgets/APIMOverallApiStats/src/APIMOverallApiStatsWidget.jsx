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
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import cloneDeep from 'lodash/cloneDeep';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMOverallApiStats from './APIMOverallApiStats';

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
 * Create React Component for APIM Overall Api Stats
 * @class APIMOverallApiStatsWidget
 * @extends {Widget}
 */
class APIMOverallApiStatsWidget extends Widget {
    /**
     * Creates an instance of APIMOverallApiStatsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallApiStatsWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            availableApiData: [],
            legendData: [],
            topApiIdData: [],
            topApiNameData: [],
            localeMessages: null,
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

        this.assembleApiAvailableQuery = this.assembleApiAvailableQuery.bind(this);
        this.assembleAPIDataQuery = this.assembleAPIDataQuery.bind(this);
        this.assembleTopAPIQuery = this.assembleTopAPIQuery.bind(this);
        this.handleApiAvailableReceived = this.handleApiAvailableReceived.bind(this);
        this.handleAPIDataReceived = this.handleAPIDataReceived.bind(this);
        this.handleTopAPIReceived = this.handleTopAPIReceived.bind(this);
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
                }, this.assembleApiAvailableQuery);
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
     * @memberof APIMOverallApiStatsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiStats/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query - apiavailablequery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleApiAvailableQuery() {
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        // eslint-disable-next-line max-len
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apiavailablequery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleApiAvailableReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleApiAvailableQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleApiAvailableReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const legendData = [];
            data.forEach((dataUnit) => {
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
            });
            this.setState({ legendData, availableApiData: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTopAPIQuery();
    }

    /**
     * Formats the siddhi query - topapiquery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleTopAPIQuery() {
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.topapiquery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleTopAPIReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleTopAPIQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleTopAPIReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            this.setState({ topApiIdData: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleAPIDataQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMOverallApiStatsWidget
     * */
    assembleAPIDataQuery() {
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleAPIDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStatsWidget
     * */
    handleAPIDataReceived(message) {
        const { data } = message;
        const { topApiIdData } = this.state;
        const { id } = this.props;
        if (data) {
            let counter = 0;
            const topApiNameData = [];
            topApiIdData.forEach((apiIdData) => {
                counter += 1;
                const apiID = apiIdData[0];
                let apiName = '';
                data.forEach((dataUnit) => {
                    if (dataUnit[0] === apiID) {
                        apiName = dataUnit[1] + ' ' + dataUnit[2];
                    }
                });
                topApiNameData.push({ id: counter, apiname: apiName, ratings: apiIdData[1] });
            });
            this.setState({ topApiNameData });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Api Stats widget
     * @memberof APIMOverallApiStatsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, availableApiData, legendData, topApiNameData,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const overallStatsProps = {
            themeName, height, availableApiData, legendData, topApiNameData,
        };

        if (!localeMessages) {
            return (<CircularProgress style={loadingIcon} />);
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                {
                    faultyProviderConfig ? (
                        <MuiThemeProvider
                            theme={themeName === 'dark' ? darkTheme : lightTheme}
                        >
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
                                             APIM Overall Api Stats widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        </MuiThemeProvider>
                    ) : (
                        <APIMOverallApiStats {...overallStatsProps} />
                    )
                }
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiStats', APIMOverallApiStatsWidget);
