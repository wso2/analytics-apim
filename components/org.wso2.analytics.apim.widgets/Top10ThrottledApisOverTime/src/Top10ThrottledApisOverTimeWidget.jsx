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
import Top10ThrottledApisOverTime from './Top10ThrottledApisOverTime';

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

const CALLBACK_TOP_10 = '_top_10';
const CALLBACK_THROTTLE = '_throttle';

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
 * Create React Component for Top 10 Throttled Apis Over Time widget
 * @class Top10ThrottledApisOverTimeWidget
 * @extends {Widget}
 */
class Top10ThrottledApisOverTimeWidget extends Widget {
    /**
     * Creates an instance of Top10ThrottledApisOverTimeWidget.
     * @param {any} props @inheritDoc
     * @memberof Top10ThrottledApisOverTimeWidget
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
            throttleData: null,
            inProgress: true,
            selectedOptions: [],
            apiList: [],
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleTopApiQuery = this.assembleTopApiQuery.bind(this);
        this.handleTopApiReceived = this.handleTopApiReceived.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleOnClickAPI = this.handleOnClickAPI.bind(this);
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
                }, this.assembleTopApiQuery);
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
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_TOP_10);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_THROTTLE);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof Top10ThrottledApisOverTimeWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/Top10ThrottledApisOverTime/locales/${locale}.json`)
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
     * Formats the siddhi query - topapiquery
     * @memberof Top10ThrottledApisOverTimeWidget
     * */
    assembleTopApiQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'topapiquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{timeFrom}}': Moment().subtract(1, 'months').toDate().getTime(),
            '{{timeTo}}': new Date().getTime(),
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + CALLBACK_TOP_10, widgetName, this.handleTopApiReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleTopApiQuery
     * @param {object} message - data retrieved
     * @memberof Top10ThrottledApisOverTimeWidget
     * */
    handleTopApiReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const selectedOptions = data.map((dataUnit) => {
                return { name: dataUnit[0], version: dataUnit[1], provider: dataUnit[2] };
            });
            this.setState({ selectedOptions }, this.assembleMainQuery);
        } else {
            this.setState({ throttleData: [], inProgress: false });
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof Top10ThrottledApisOverTimeWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, selectedOptions,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;

        if (selectedOptions && selectedOptions.length > 0) {
            let filterCondition = selectedOptions.map((opt) => {
                return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
            });
            filterCondition = filterCondition.join(' OR ');

            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'throttlequery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': Moment().subtract(1, 'months').toDate().getTime(),
                '{{timeTo}}': new Date().getTime(),
                '{{filterCondition}}': filterCondition,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + CALLBACK_THROTTLE, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, throttleData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof Top10ThrottledApisOverTimeWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { selectedOptions } = this.state;

        if (data && data.length > 0) {
            const apiList = selectedOptions
                .sort((a, b) => {
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                })
                .map((api) => {
                    return api.name + ' :: ' + api.version + ' (' + api.provider + ')';
                });
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = obj[4];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push({ apiname: obj[0] + ' :: ' + obj[1] + ' (' + obj[2] + ')', hits: obj[3] });
                return acc;
            }, {});
            const throttleData = Object.keys(dataGroupByTime).map((key) => {
                const availableUsage = dataGroupByTime[key];
                const usage = [];
                apiList.forEach((api) => {
                    const apiUsage = availableUsage.find(selc => selc.apiname === api);
                    if (apiUsage) {
                        usage.push(apiUsage.hits);
                    } else {
                        usage.push(0);
                    }
                });
                usage.push(parseInt(key, 10));
                return usage;
            });
            this.setState({ throttleData, apiList, inProgress: false });
        } else {
            this.setState({ throttleData: [], inProgress: false });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof Top10ThrottledApisOverTimeWidget
     * */
    handleOnClickAPI(data) {
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
     * @returns {ReactElement} Render the Top 10 Throttled Apis Over Time widget
     * @memberof Top10ThrottledApisOverTimeWidget
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
                                                + 'Top 10 Throttled Apis Over Time widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <Top10ThrottledApisOverTime
                                    {...faultProps}
                                    handleOnClickAPI={this.handleOnClickAPI}
                                />
                            )
                        }
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('Top10ThrottledApisOverTime', Top10ThrottledApisOverTimeWidget);
