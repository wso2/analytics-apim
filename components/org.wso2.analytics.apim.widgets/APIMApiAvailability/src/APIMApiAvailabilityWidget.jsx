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
import APIMApiAvailability from './APIMApiAvailability';

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
 * Create React Component for APIM Api Availability
 * @class APIMApiAvailabilityWidget
 * @extends {Widget}
 */
class APIMApiAvailabilityWidget extends Widget {
    /**
     * Creates an instance of APIMApiAvailabilityWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiAvailabilityWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            availableApiData: null,
            legendData: [],
            localeMessages: null,
            inProgress: true,
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

        this.assembleApiAvailableQuery = this.assembleApiAvailableQuery.bind(this);
        this.handleApiAvailableReceived = this.handleApiAvailableReceived.bind(this);
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
     * @memberof APIMApiAvailabilityWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiAvailability/locales/${locale}.json`)
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
     * Formats the siddhi query - apiavailablequery
     * @memberof APIMApiAvailabilityWidget
     * */
    assembleApiAvailableQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiavailablequery';
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiAvailableReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleApiAvailableQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiAvailabilityWidget
     * */
    handleApiAvailableReceived(message) {
        const { data } = message;
        const legend = [{ name: 'Available' }, { name: 'Response time is high' },
            { name: 'Server error occurred' }];

        if (data) {
            let availableCount = 0;
            let responseHighCount = 0;
            let serverErrorCount = 0;
            const dataModified = [];
            data.forEach((dataUnit) => {
                if (dataUnit[0].includes(legend[0].name)) {
                    // eslint-disable-next-line prefer-destructuring
                    availableCount = dataUnit[1];
                } else if (dataUnit[0].includes(legend[1].name)) { // Response time high messages are not unique
                    const currentKeyResponseHighCount = dataUnit[1];
                    responseHighCount += currentKeyResponseHighCount;
                } else if (dataUnit[0].includes(legend[2].name)) {
                    // eslint-disable-next-line prefer-destructuring
                    serverErrorCount = dataUnit[1];
                }
            });

            const legendData = [];
            legendData.push(legend[0]);
            dataModified[0] = [legend[0].name, availableCount];
       
            if (responseHighCount > 0) {
                legendData.push(legend[1]);
                dataModified[dataModified.length] = [legend[1].name, responseHighCount];
            }
            if (serverErrorCount > 0) {
                legendData.push(legend[2]);
                dataModified[dataModified.length] = [legend[2].name, serverErrorCount];
            }
            this.setState({ legendData, availableApiData: dataModified, inProgress: false });
        } else {
            this.setState({ inProgress: false });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Availability widget
     * @memberof APIMApiAvailabilityWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, availableApiData, legendData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiAvailabilityProps = {
            themeName, height, availableApiData, legendData, inProgress,
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
                                            + ' Api Availability widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiAvailability {...apiAvailabilityProps} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiAvailability', APIMApiAvailabilityWidget);
