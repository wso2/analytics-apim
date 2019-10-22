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
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMTopApiCreators from './APIMTopApiCreators';

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
const queryParamKey = 'apiCreators';

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
 * Create React Component for APIM Top Api Creators
 * @class APIMTopApiCreatorsWidget
 * @extends {Widget}
 */
class APIMTopApiCreatorsWidget extends Widget {
    /**
     * Creates an instance of APIMTopApiCreatorsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopApiCreatorsWidget
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
            creatorData: [],
            legendData: [],
            limit: 0,
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
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getContext = this.getContext.bind(this);
    }

    getContext() {
        let { username } = super.getCurrentUser();
        const usernameParts = username.split('@');
        if (username.includes('@carbon.super')) {
            return 'NOT(str:contains(CONTEXT,\'/t/\'))';
        } else {
            return '(str:contains(CONTEXT,\'/t/' +  usernameParts[usernameParts.length -1] + '\'))';
        }
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
     * @memberof APIMTopApiCreatorsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopApiCreators/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMTopApiCreatorsWidget
     * */
    assembleQuery() {
        const { providerConfig } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        let { limit } = queryParam;
        const { id, widgetID: widgetName } = this.props;

        if (!limit || limit < 0) {
            limit = 5;
        }

        this.setState({ limit, creatorData: [] });
        this.setQueryParam(limit);

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'query';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{limit}}': limit,
            '{{contextContainsCondition}}': this.getContext(),
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMTopApiCreatorsWidget
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
                creatorData.push({ id: counter, creator: dataUnit[0], apicount: dataUnit[1] });
            });

            this.setState({ legendData, creatorData, inProgress: false });
            this.setQueryParam(limit);
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof APIMTopApiCreatorsWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle Select Change
     * @param {Event} event - listened event
     * @memberof APIMTopApiCreatorsWidget
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
     * @returns {ReactElement} Render the APIM Top Api Creators widget
     * @memberof APIMTopApiCreatorsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, creatorData, legendData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiCreatorsProps = {
            themeName, height, limit, creatorData, legendData, inProgress,
        };

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Top Api Creators widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        </MuiThemeProvider>
                    ) : (
                        <APIMTopApiCreators {...apiCreatorsProps} handleChange={this.handleChange} />
                    )
                }
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopApiCreators', APIMTopApiCreatorsWidget);
