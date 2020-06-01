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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
import OverallFaultAnalytics from './OverallFaultAnalytics';

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
 * Create React Component for Api Fault Analytics widget
 * @class OverallFaultAnalyticsWidget
 * @extends {Widget}
 */
class OverallFaultAnalyticsWidget extends Widget {
    /**
     * Creates an instance of OverallFaultAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof OverallFaultAnalyticsWidget
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
            faultData: null,
            inProgress: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
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
                }, this.assembleMainQuery);
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
     * @memberof OverallFaultAnalyticsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/OverallFaultAnalytics/locales/${locale}.json`)
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
     * Formats the siddhi query - query
     * @memberof OverallFaultAnalyticsWidget
     * */
    assembleMainQuery() {
        const { providerConfig } = this.state;
        const { widgetID: widgetName, id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.queryData.queryName = 'query';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{timeFrom}}': Moment().subtract(1, 'months').toDate().getTime(),
            '{{timeTo}}': new Date().getTime(),
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof OverallFaultAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        if (data && data.length > 0) {
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = obj[1];
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key] += obj[0];
                return acc;
            }, {});
            const faultData = Object.keys(dataGroupByTime).map((key) => {
                return [dataGroupByTime[key], parseInt(key, 10)];
            });
            this.setState({ faultData, inProgress: false });
        } else {
            this.setState({ inProgress: false, tableData: [] });
        }
    }

    /**
     * Handle onClick and drill down
     * @memberof OverallFaultAnalyticsWidget
     * */
    handleOnClick() {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];

                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '#{"dtrp":{"tr":"1month"}}';
            }
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Api Fault Analytics widget
     * @memberof OverallFaultAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, inProgress, faultData,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const faultProps = {
            themeName,
            height,
            width,
            faultData,
            inProgress,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    <div>
                        {
                            faultyProviderConfig ? (
                                <div style={paperWrapper}>
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
                                                defaultMessage={'Cannot fetch provider configuration for '
                                                + 'Overall Fault Analytics widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <OverallFaultAnalytics
                                    {...faultProps}
                                    handleOnClick={this.handleOnClick}
                                />
                            )
                        }
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('OverallFaultAnalytics', OverallFaultAnalyticsWidget);
