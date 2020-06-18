/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import ApiAvailability from './ApiAvailability';

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

const queryParamKey = 'apiAvailability';

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
 * Create React Component for Api Availability
 * @class ApiAvailabilityWidget
 * @extends {Widget}
 */
class ApiAvailabilityWidget extends Widget {
    /**
     * Creates an instance of ApiAvailabilityWidget.
     * @param {any} props @inheritDoc
     * @memberof ApiAvailabilityWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            availableApiData: [],
            limit: 5,
            localeMessages: null,
            inProgress: true,
            status: 'all',
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
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
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
                }, () => {
                    this.assembleApiAvailableQuery();
                    super.subscribe(this.handlePublisherParameters);
                });
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
     * @memberof ApiAvailabilityWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/ApiAvailability/locales/${locale}.json`)
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
     * Retrieve params from publishers
     * @memberof ApiAvailabilityWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const { status } = receivedMsg;
        const { limit } = this.state;

        document.getElementById('api-availability').scrollIntoView();
        this.setQueryParam(limit, status);
        this.setState({
            inProgress: true,
            status: status.split(' ').slice(0, 2).join(' '),
        }, this.assembleApiAvailableQuery);
    }

    /**
     * Retrieve the limit from query param
     * @memberof ApiAvailabilityWidget
     * */
    loadLimit() {
        let { limit, status } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        if (!status || !['all', 'available', 'response time', 'server error'].includes(status.toLowerCase())) {
            status = 'all';
        }
        this.setQueryParam(limit, status);
        this.setState({ limit, status });
    }

    /**
     * Formats the siddhi query - apiavailablequery
     * @memberof ApiAvailabilityWidget
     * */
    assembleApiAvailableQuery() {
        const { providerConfig, limit, status } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (limit > 0) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiavailablequery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{limit}}': limit,
                '{{status}}': status !== 'all' ? 'AND (str:contains(status,\'' + status + '\'))' : '',
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiAvailableReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, availableApiData: [] });
        }
    }

    /**
     * Formats data received from assembleApiAvailableQuery
     * @param {object} message - data retrieved
     * @memberof ApiAvailabilityWidget
     * */
    handleApiAvailableReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const availableApiData = data.map((dataUnit) => {
                return {
                    apiname: dataUnit[0] + ' (' + dataUnit[2] + ')',
                    apiversion: dataUnit[1],
                    status: dataUnit[3] === 'Available' ? 'available' : 'limited',
                    reason: dataUnit[3],
                };
            });
            this.setState({ availableApiData, inProgress: false });
        } else {
            this.setState({ inProgress: false, availableApiData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof ApiAvailabilityWidget
     * */
    setQueryParam(limit, status) {
        super.setGlobalState(queryParamKey, { limit, status });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof ApiAvailabilityWidget
     * */
    handleLimitChange(event) {
        const { status } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(parseInt(limit, 10), status);
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleApiAvailableQuery);
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle status Change
     * @param {Event} event - listened event
     * @memberof ApiAvailabilityWidget
     * */
    handleStatusChange(event) {
        const { limit } = this.state;
        this.setQueryParam(limit, event.target.value);
        this.setState({ inProgress: true, status: event.target.value }, this.assembleApiAvailableQuery);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Api Availability widget
     * @memberof ApiAvailabilityWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, availableApiData, inProgress, limit, status,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiAvailabilityProps = {
            themeName, height, availableApiData, inProgress, limit, status,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    <div id='api-availability'>
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
                                                defaultMessage={'Cannot fetch provider configuration for '
                                            + ' Api Availability widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <ApiAvailability
                                    {...apiAvailabilityProps}
                                    handleLimitChange={this.handleLimitChange}
                                    handleStatusChange={this.handleStatusChange}
                                />
                            )
                        }
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('ApiAvailability', ApiAvailabilityWidget);
