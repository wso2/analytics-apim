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
import APIMApiBackendUsage from './APIMApiBackendUsage';

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
const queryParamKey = 'apibackendusage';

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
 * Create React Component for APIM Api Backend Usage Summary widget
 * @class APIMApiBackendUsageWidget
 * @extends {Widget}
 */
class APIMApiBackendUsageWidget extends Widget {
    /**
     * Creates an instance of APIMApiBackendUsageWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiBackendUsageWidget
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
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            apiCreatedBy: 'All',
            limit: 0,
            usageData: null,
            localeMessages: null,
            inProgress: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleChange = this.handleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
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
     * @memberof APIMApiBackendUsageWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiBackendUsageSummary/locales/${locale}.json`)
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
     * @memberof APIMApiBackendUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: true,
        }, this.assembleApiUsageQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMApiBackendUsageWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { limit } = queryParam;
        if (!apiCreatedBy || !(apiCreatedBy in createdByKeys)) {
            apiCreatedBy = 'All';
        }
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setState({ apiCreatedBy, limit });
        this.setQueryParam(apiCreatedBy, limit);
    }

    /**
     * Formats the siddhi query - apiusagequery
     * @memberof APIMApiBackendUsageWidget
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
            '{{creator}}': apiCreatedBy !== 'All' ? 'AND apiCreator==\'' + username + '\'' : '',
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
     * @memberof APIMApiBackendUsageWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;
        const { apiCreatedBy, limit } = this.state;

        if (data) {
            const usageData = data.map( dataUnit => {
                return {
                    apiname: dataUnit[0] + ' (' + dataUnit[2] + ')',
                    version: dataUnit[1],
                    context: dataUnit[3],
                    destination: dataUnit[4],
                    hits: dataUnit[5],
                }
            });
            this.setState({ usageData, inProgress: false });
            this.setQueryParam(apiCreatedBy, limit);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMApiBackendUsageWidget
     * */
    setQueryParam(apiCreatedBy, limit) {
        super.setGlobalState(queryParamKey, { apiCreatedBy, limit });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMApiBackendUsageWidget
     * */
    handleChange(event) {
        const { apiCreatedBy } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];
        const { id } = this.props;

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
     * @memberof APIMApiBackendUsageWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { value } = event.target;
        const { id } = this.props;

        this.setQueryParam(value, limit);
        this.setState({ inProgress: true, apiCreatedBy: value });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiUsageQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Backend Usage Summary widget
     * @memberof APIMApiBackendUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, usageData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const backendUsageProps = {
            themeName, height, limit, apiCreatedBy, usageData, inProgress,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api'
                                            + ' Backend Usage Summary widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiBackendUsage
                                {...backendUsageProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                handleChange={this.handleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiBackendUsageSummary', APIMApiBackendUsageWidget);
