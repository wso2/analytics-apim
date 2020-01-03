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
            subscribers: [],
            creatorData: [],
            legendData: [],
            limit: 5,
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

        this.assembleQuery = this.assembleQuery.bind(this);
        this.assembleSubscriberQuery = this.assembleSubscriberQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleSubscriberDataReceived = this.handleSubscriberDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
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
                }, this.assembleSubscriberQuery);
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
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMTopAppCreators/locales/${locale}.json`)
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
     * Retrieves subscribers
     * @memberof APIMTopAppCreatorsWidget
     * */
    assembleSubscriberQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'subscriberQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleSubscriberDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMTopAppCreatorsWidget
     * */
    handleSubscriberDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const subscribers = data.map(dataUnit => { return dataUnit[0]; });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ subscribers }, this.assembleQuery);
        } else {
            this.setState({ inProgress: false, creatorData: [] });
        }
    }

    /**
     * Retrieves applications for subscribers
     * @memberof APIMTopAppCreatorsWidget
     * */
    assembleQuery() {
        const { providerConfig, subscribers } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const queryParam = super.getGlobalState(queryParamKey);
        let { limit } = queryParam;

        if (!limit || limit < 0) {
            limit = 5;
        }
        if (subscribers && subscribers.length > 0) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            let subs = subscribers.map(sub => { return 'SUBSCRIBER_ID==' + sub; });
            subs = subs.join(' OR ');
            dataProviderConfigs.configs.config.queryData.queryName = 'appQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{subscriberId}}': subs,
                '{{limit}}': limit
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, creatorData: [] });
        }
    }


    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMTopAppCreatorsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const legendData = [];
            const creatorData = [];

            data.forEach((dataUnit) => {
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
                creatorData.push({ creator: dataUnit[0], appcount: dataUnit[1] });
            });
            this.setState({ legendData, creatorData, inProgress: false });
        } else {
            this.setState({ inProgress: false, creatorData: [] });
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
        const { id } = this.props;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top App Creators widget
     * @memberof APIMTopAppCreatorsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, creatorData, legendData, inProgress, limit,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const appCreatorsProps = {
            themeName, height, creatorData, legendData, inProgress, limit,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                {
                    faultyProviderConfig ? (
                        <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Top '
                                            + 'App Creators widget'}
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
