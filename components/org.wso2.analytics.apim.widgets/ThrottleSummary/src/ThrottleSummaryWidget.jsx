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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Widget from '@wso2-dashboards/widget';
import ThrottleSummary from './ThrottleSummary';

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
 * Create React Component for Throttle Summary widget
 * @class ThrottleSummaryWidget
 * @extends {Widget}
 */
class ThrottleSummaryWidget extends Widget {
    /**
     * Creates an instance of ThrottleSummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof ThrottleSummaryWidget
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
            throttleData: [],
            apiList: [],
            inProgress: true,
            dimension: null,
            selectedOptions: [],
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
     * @memberof ThrottleSummaryWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/ThrottleSummary/locales/${locale}.json`)
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
     * @memberof ThrottleSummaryWidget
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
     * @memberof ThrottleSummaryWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, dimension, selectedOptions,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                let filterCondition = selectedOptions.map((opt) => {
                    return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
                });
                filterCondition = filterCondition.join(' OR ');

                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'query';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{timeFrom}}': timeFrom,
                    '{{timeTo}}': timeTo,
                    '{{per}}': perValue,
                    '{{filterCondition}}': filterCondition,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
            } else {
                this.setState({ inProgress: false, throttleData: [] });
            }
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof ThrottleSummaryWidget
     * */
    handleDataReceived(message) {
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
                acc[key].push({ apiname: obj[0] + ' :: ' + obj[1] + ' (' + obj[2] + ')', count: obj[3] });
                return acc;
            }, {});
            const throttleData = Object.keys(dataGroupByTime).map((key) => {
                const availableUsage = dataGroupByTime[key];
                const throttleInfo = [];
                apiList.forEach((api) => {
                    const apiUsage = availableUsage.find(selc => selc.apiname === api);
                    if (apiUsage && apiUsage.length > 0) {
                        throttleInfo.push(apiUsage.count);
                    } else {
                        throttleInfo.push(0);
                    }
                });
                throttleInfo.push(parseInt(key, 10));
                return throttleInfo;
            });


            this.setState({ throttleData, apiList, inProgress: false });
        } else {
            this.setState({ inProgress: false, throttleData: [] });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof ThrottleSummaryWidget
     * */
    handleOnClick(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const name = Object.keys(data).find(key => key.includes('::'));
                const splitName = name.split(' :: ');
                const api = splitName[0].trim();
                const apiversion = splitName[1].split(' (')[0].trim();
                const provider = splitName[1].split(' (')[1].split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];

                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '#{"dtrp":{"tr":"1month"},"dmSelc":{"dm":"api",'
                    + '"op":[{"name":"' + api + '","version":"' + apiversion + '","provider":"' + provider + '"}]}}';
            }
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Throttle Summary widget
     * @memberof ThrottleSummaryWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, inProgress, throttleData, apiList,
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
            throttleData,
            inProgress,
            apiList,
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
                                                + 'Throttle Summary widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <ThrottleSummary
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

global.dashboard.registerWidget('ThrottleSummary', ThrottleSummaryWidget);
