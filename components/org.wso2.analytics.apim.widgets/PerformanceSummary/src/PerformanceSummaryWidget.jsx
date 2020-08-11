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
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Axios from 'axios';
import Moment from 'moment';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import PerformanceSummary from './PerformanceSummary';

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
 * Create React Component for Performance Summary
 * @class PerformanceSummaryWidget
 * @extends {Widget}
 */
class PerformanceSummaryWidget extends Widget {
    /**
     * Creates an instance of PerformanceSummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof PerformanceSummaryWidget
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
            apiCreatedBy: 'all',
            latencyData: null,
            localeMessages: null,
            inProgress: true,
            apiList: [],
            selectedOptions: [],
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleLatencyQuery = this.assembleLatencyQuery.bind(this);
        this.handleApiLatencyReceived = this.handleApiLatencyReceived.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
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
     * @memberof PerformanceSummaryWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/PerformanceSummary/locales/${locale}.json`)
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
     * Retrieve params from publisher - DateTimeRange
     * @memberof PerformanceSummaryWidget
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
            }, this.assembleLatencyQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleLatencyQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleLatencyQuery);
        }
    }

    /**
     * Formats the siddhi query - apiusagequery
     * @memberof PerformanceSummaryWidget
     * */
    assembleLatencyQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, dimension, selectedOptions,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                let filterCondition = selectedOptions.map((opt) => {
                    return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
                });
                filterCondition = filterCondition.join(' OR ');

                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'apilatencyquery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{filterCondition}}': filterCondition,
                    '{{from}}': timeFrom,
                    '{{to}}': timeTo,
                    '{{per}}': perValue,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleApiLatencyReceived,
                        dataProviderConfigs);
            } else {
                this.setState({
                    latencyData: [], inProgress: false,
                });
            }
        }
    }

    /**
     * Formats data retrieved from assembleLatencyQuery
     * @param {object} message - data retrieved
     * @memberof PerformanceSummaryWidget
     * */
    handleApiLatencyReceived(message) {
        const { data } = message;
        const { selectedOptions } = this.state;

        if (data && data.length > 0) {
            const apiList = selectedOptions
                .sort((a, b) => { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); })
                .map((api) => { return api.name + ' :: ' + api.version + ' (' + api.provider + ')'; });
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = obj[4];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({ apiname: obj[0] + ' :: ' + obj[2] + ' (' + obj[1] + ')', latency: obj[3] });
                return acc;
            }, {});
            const latencyData = Object.keys(dataGroupByTime).map((key) => {
                const availableLatencyData = dataGroupByTime[key];
                const perf = [];
                apiList.forEach((api) => {
                    const apiPerf = availableLatencyData.find(selc => selc.apiname === api);
                    if (apiPerf) {
                        perf.push(apiPerf.latency);
                    } else {
                        perf.push(0);
                    }
                });
                perf.push(parseInt(key, 10));
                return perf;
            });
            this.setState({ latencyData, apiList, inProgress: false });
        } else {
            this.setState({ latencyData: [], inProgress: false });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof PerformanceSummaryWidget
     * */
    handleOnClick(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const {
                    tr, sd, ed, g,
                } = super.getGlobalState('dtrp');
                const name = Object.keys(data).find(key => key.includes('::'));
                const splitName = name.split(' :: ');
                const api = splitName[0].trim();
                const apiversion = splitName[1].split(' (')[0].trim();
                const provider = splitName[1].split(' (')[1].split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];
                const queryParams = {
                    dtrp: {
                        tr,
                        sd,
                        ed,
                        g,
                    },
                    dmSelc: {
                        dm: 'api',
                        op: [{ name: api, version: apiversion, provider }],
                    },
                };
                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '?widgetStates='
                    + encodeURI(JSON.stringify(queryParams));
            }
        }
    }


    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Performance Summary widget
     * @memberof PerformanceSummaryWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, width, height, latencyData, inProgress, apiList,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiPerfOverTimeProps = {
            themeName, width, height, latencyData, inProgress, apiList,
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
                                            defaultMessage={'Cannot fetch provider configuration for'
                                            + ' Performance Summary widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <PerformanceSummary
                                {...apiPerfOverTimeProps}
                                handleOnClick={this.handleOnClick}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('PerformanceSummary', PerformanceSummaryWidget);
