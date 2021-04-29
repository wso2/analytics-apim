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
import APIMApiLastAccess from './APIMApiLastAccess';

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
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apilastaccess';

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
 * Create React Component for APIM Api Last Access Summary widget
 * @class APIMApiLastAccessWidget
 * @extends {Widget}
 */
class APIMApiLastAccessWidget extends Widget {
    /**
     * Creates an instance of APIMApiLastAccessWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiLastAccessWidget
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
            limit: 5,
            accessData: null,
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
        this.assembleApiAccessQuery = this.assembleApiAccessQuery.bind(this);
        this.handleApiAccessReceived = this.handleApiAccessReceived.bind(this);
        this.getUsername = this.getUsername.bind(this);
    }

    /**
     * Initialize i18n.
     */
    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    /**
     * Load locale file.
     *
     * @param {string} locale Locale name
     * @returns {Promise} Promise
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiLastAccessSummary/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;
        this.getUsername();

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleApiAccessQuery);
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
     * Reset the state according to queryParam
     * @memberof APIMApiLastAccessWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy, limit } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setState({ apiCreatedBy, limit });
        this.setQueryParam(apiCreatedBy, limit);
    }

    /**
     * Formats the siddhi query - lastaccessquery
     * @memberof APIMApiLastAccessWidget
     * */
    assembleApiAccessQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { limit, apiCreatedBy } = queryParam;
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'lastaccessquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{limit}}': limit,
            '{{apiCreator}}': apiCreatedBy !== 'All' ? 'AND apiCreator==\'{{formattedUsername}}\'' : '',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiAccessReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiAccessQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLastAccessWidget
     * */
    handleApiAccessReceived(message) {
        const { data } = message;

        if (data) {
            const accessData = data.map((dataUnit) => {
                return {
                    apiname: dataUnit[0] + ' (' + dataUnit[2] + ')',
                    version: dataUnit[1],
                    context: dataUnit[3],
                    subscriber: dataUnit[4],
                    lastaccess: dataUnit[5],
                };
            });
            this.setState({ accessData, inProgress: false });
        } else {
            this.setState({ inProgress: false, accessData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMApiLastAccessWidget
     * */
    setQueryParam(apiCreatedBy, limit) {
        super.setGlobalState(queryParamKey, { apiCreatedBy, limit });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMApiLastAccessWidget
     * */
    handleChange(event) {
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        const { id } = this.props;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(apiCreatedBy, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleApiAccessQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLastAccessWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

        this.setState({ inProgress: true });
        this.setQueryParam(event.target.value, limit);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiAccessQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Last Access Summary widget
     * @memberof APIMApiLastAccessWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, accessData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const lastAccessProps = {
            themeName, height, limit, apiCreatedBy, accessData, inProgress, username,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Last Access Summary widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiLastAccess
                                {...lastAccessProps}
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

global.dashboard.registerWidget('APIMApiLastAccessSummary', APIMApiLastAccessWidget);
