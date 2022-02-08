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
import ApiThrottleAnalytics from './ApiThrottleAnalytics';

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

const queryParamKey = 'apiThrottle';

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
 * Create React Component for Api Throttle Analytics widget
 * @class ApiThrottleAnalyticsWidget
 * @extends {Widget}
 */
class ApiThrottleAnalyticsWidget extends Widget {
    /**
     * Creates an instance of ApiThrottleAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof ApiThrottleAnalyticsWidget
     */
    constructor(props) {
        super(props);

        this.styles = {
            formControl: {
                margin: 5,
                minWidth: 120,
            },
            selectEmpty: {
                marginTop: 10,
            },
            form: {
                display: 'flex',
                flexWrap: 'wrap',
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
            throttleData: null,
            tableData: null,
            inProgress: true,
            dimension: null,
            selectedOptions: [],
            limit: 5,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
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
     * @memberof ApiThrottleAnalyticsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/ApiThrottleAnalytics/locales/${locale}.json`)
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
     * Retrieve the limit from query param
     * @memberof ApiThrottleAnalyticsWidget
     * */
    loadLimit() {
        let { limit } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setQueryParam(limit);
        this.setState({ limit });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof ApiThrottleAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam; const {
            from, to, granularity, dm, op,
        } = receivedMsg;

        if (dm && from) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleMainQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleMainQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleMainQuery);
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof ApiThrottleAnalyticsWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, dimension, selectedOptions, limit,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0 && limit > 0) {
                const filterCondition = '(apiName==\'' + selectedOptions[0].name + '\' AND apiVersion==\''
                    + selectedOptions[0].version + '\' AND apiCreator==\'' + selectedOptions[0].provider + '\')';

                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'query';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{timeFrom}}': timeFrom,
                    '{{timeTo}}': timeTo,
                    '{{per}}': perValue,
                    '{{filterCondition}}': filterCondition,
                    '{{limit}}': limit,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
            } else {
                this.setState({ inProgress: false, throttleData: [], tableData: [] });
            }
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof ApiThrottleAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const tableData = data.map((dataUnit) => {
                return ({
                    time: Moment(dataUnit[3]).format('YYYY-MMM-DD hh:mm:ss A'),
                    appName: dataUnit[0],
                    reason: dataUnit[2].split('_').join(' ').toLowerCase(),
                    count: dataUnit[1],
                });
            });
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = obj[3];
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key] += obj[1];
                return acc;
            }, {});
            const throttleData = Object.keys(dataGroupByTime).map((key) => {
                return [dataGroupByTime[key], parseInt(key, 10)];
            });
            this.setState({ throttleData, tableData, inProgress: false });
        } else {
            this.setState({ inProgress: false, throttleData: [], tableData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof ApiThrottleAnalyticsWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof ApiThrottleAnalyticsWidget
     * */
    handleLimitChange(event) {
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleMainQuery);
        } else {
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ limit, throttleData: [], tableData: [], inProgress: false });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Api Throttle Analytics widget
     * @memberof ApiThrottleAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, inProgress, throttleData, limit,
            tableData, timeTo, timeFrom
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const faultProps = {
            themeName,
            height,
            width,
            throttleData,
            tableData,
            inProgress,
            username,
            limit,
            timeTo,
            timeFrom,
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
                                                    + 'Api Throttle Analytics widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <ApiThrottleAnalytics
                                    {...faultProps}
                                    handleLimitChange={this.handleLimitChange}
                                />
                            )
                        }
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('ApiThrottleAnalytics', ApiThrottleAnalyticsWidget);
