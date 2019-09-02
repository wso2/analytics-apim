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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import cloneDeep from 'lodash/cloneDeep';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMTopAppCreators from './APIMTopAppCreators';

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
const queryParamKey = 'appCreators';

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
 * Create React Component for APIM Top App Creators
 * @class APIMTopAppCreatorsWidget
 * @extends {Widget}
 */
class APIMTopAppCreatorsWidget extends Widget {
    /**
     * Creates an instance of APIMTopAppCreatorsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopAppCreatorsWidget
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
            creatorData: [],
            legendData: [],
            limit: 0,
            localeMessages: null,
        };

        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
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
                }, this.assembleQuery);
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
     * @memberof APIMTopAppCreatorsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopAppCreators/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMTopAppCreatorsWidget
     * */
    assembleQuery() {
        const { providerConfig } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        let { limit } = queryParam;

        if (!limit) {
            limit = 5;
        }

        this.setState({ limit, creatorData: [] });
        this.setQueryParam(limit);

        const { id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let { query } = dataProviderConfigs.configs.config.queryData;
        query = query
            .replace('{{limit}}', limit);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMTopAppCreatorsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { limit } = this.state;

        if (data) {
            const creatorData = [];
            const legendData = [];
            let counter = 0;
            data.forEach((dataUnit) => {
                counter += 1;
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
                creatorData.push({ id: counter, creator: dataUnit[0], appcount: dataUnit[1] });
            });

            this.setState({ legendData, creatorData });
            this.setQueryParam(limit);
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof APIMTopAppCreatorsWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle Select Change
     * @param {Event} event - listened event
     * @memberof APIMTopAppCreatorsWidget
     * */
    handleChange(event) {
        const queryParam = super.getGlobalState(queryParamKey);
        const { limit } = queryParam;
        const { id } = this.props;

        this.setQueryParam(event.target.value);
        this.setState({ limit });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top App Creators widget
     * @memberof APIMTopAppCreatorsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, creatorData, legendData,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const appCreatorsProps = {
            themeName, height, limit, creatorData, legendData,
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
                                             APIM Top App Creators widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        </MuiThemeProvider>
                    ) : (
                        <APIMTopAppCreators {...appCreatorsProps} handleChange={this.handleChange} />
                    )
                }
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopAppCreators', APIMTopAppCreatorsWidget);
