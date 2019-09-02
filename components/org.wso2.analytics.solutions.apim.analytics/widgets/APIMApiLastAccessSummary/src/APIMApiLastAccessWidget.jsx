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
            limit: 0,
            accessData: null,
            localeMessages: null,
        };

        this.handleChange = this.handleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.assembleApiAccessQuery = this.assembleApiAccessQuery.bind(this);
        this.handleApiAccessReceived = this.handleApiAccessReceived.bind(this);
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
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMApiLastAccessWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiLastAccessSummary/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMApiLastAccessWidget
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy } = queryParam;
        let { limit } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!limit) {
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
        const { limit } = queryParam;
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.lastaccessquery;
        query = query
            .replace('{{limit}}', limit);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleApiAccessReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiAccessQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiLastAccessWidget
     * */
    handleApiAccessReceived(message) {
        const { data } = message;
        const currentUser = super.getCurrentUser();
        const { apiCreatedBy, limit } = this.state;

        if (data) {
            const accessData = [];
            const counter = 0;

            data.forEach((dataUnit) => {
                if (apiCreatedBy === createdByKeys.All) {
                    accessData.push({
                        id: counter,
                        apiname: dataUnit[0],
                        version: dataUnit[1],
                        context: dataUnit[3],
                        subscriber: dataUnit[4],
                        lastaccess: dataUnit[5],
                    });
                } else if (apiCreatedBy === createdByKeys.Me) {
                    if (currentUser.username === dataUnit[2]) {
                        accessData.push({
                            id: counter,
                            apiname: dataUnit[0],
                            version: dataUnit[1],
                            context: dataUnit[3],
                            subscriber: dataUnit[4],
                            lastaccess: dataUnit[5],
                        });
                    }
                }
            });
            this.setState({ accessData });
            this.setQueryParam(apiCreatedBy, limit);
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
        const { apiCreatedBy } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiAccessQuery();
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMApiLastAccessWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

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
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, accessData,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const lastAccessProps = {
            themeName, height, limit, apiCreatedBy, accessData,
        };

        if (!localeMessages || !accessData) {
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
                                             APIM Api Last Access Summary widget'
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
