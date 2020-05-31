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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMSubscriptionsAnalytics from './APIMSubscriptionsAnalytics';

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
 * Create React Component for APIM Subscriptions Analytics
 * @class APIMSubscriptionsAnalyticsWidget
 * @extends {Widget}
 */
class APIMSubscriptionsAnalyticsWidget extends Widget {
    /**
     * Creates an instance of APIMSubscriptionsAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMSubscriptionsAnalyticsWidget
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
            timeTo: null,
            timeFrom: null,
            perValue: null,
            chartData: null,
            tableData: null,
            localeMessages: null,
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

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
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
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMSubscriptionsAnalytics/locales/`
                    + `${locale}.json`)
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
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
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
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, providerConfig, dimension, selectedOptions,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (providerConfig && dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                const apiList = selectedOptions.map((opt) => { return opt.name; });
                const dataProviderConfigs = cloneDeep(providerConfig);
                const { config } = dataProviderConfigs.configs;

                config.tableName = 'AM_SUBSCRIPTION';
                config.incrementalColumn = 'CREATED_TIME';
                config.queryData.queryName = 'mainquery';
                config.queryData.queryValues = {
                    '{{apiName}}': apiList[0] !== 'All' ? 'AND api.API_NAME in (\'' + apiList.join('\', \'') + '\')'
                        : '',
                    '{{timeFrom}}': Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'),
                    '{{timeTo}}': Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'),
                };
                dataProviderConfigs.configs.config = config;
                super.getWidgetChannelManager().subscribeWidget(id, widgetName,
                    this.handleDataReceived, dataProviderConfigs);
            } else {
                this.setState({ chartData: [], tableData: [], inProgress: false });
            }
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data && data.length !== 0) {
            const tableData = data.map((dataUnit) => {
                return {
                    apiname: dataUnit[2] + ' (' + dataUnit[3] + ')',
                    application: dataUnit[4] + ' (' + dataUnit[5] + ')',
                    subscribedtime: Moment(dataUnit[1]).format('YYYY-MMM-DD hh:mm:ss A'),
                    apiversion: dataUnit[6],
                };
            });

            const timeFormat = this.getDateFormat();
            const dataGroupByTime = data.reduce((acc, obj) => {
                const key = Moment(obj[1]).format(timeFormat);
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key] += obj[0];
                return acc;
            }, {});
            const chartData = Object.keys(dataGroupByTime).map((key) => {
                return [dataGroupByTime[key], Moment(key, timeFormat).toDate().getTime()];
            });
            chartData.sort((a, b) => { return a[1] - b[1]; });
            this.setState({ chartData, tableData, inProgress: false });
        } else {
            this.setState({ chartData: [], tableData: [], inProgress: false });
        }
    }

    /**
     * Get time format for the selected granularity
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    getDateFormat() {
        const { perValue } = this.state;
        switch (perValue) {
            case 'minute':
                return 'YYYY-MMM-DD HH:mm';
            case 'hour':
                return 'YYYY-MMM-DD HH';
            case 'day':
                return 'YYYY-MMM-DD';
            case 'month':
                return 'YYYY-MMM';
            case 'year':
                return 'YYYY';
            case 'second':
            default:
                return 'YYYY-MMM-DD HH:mm:ss';
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof APIMSubscriptionsAnalyticsWidget
     * */
    handleOnClickAPI(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const { apiname, apiversion } = data;
                const api = (apiname.split(' (')[0]).trim();
                const provider = (apiname.split('(')[1]).split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];

                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '#{"dmSelc":{"dm":"api","op":[{"name":"' + api
                    + '","version":"' + apiversion + '","provider":"' + provider + '"}]}}';
            }
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Subscriptions Analytics widget
     * @memberof APIMSubscriptionsAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, inProgress, chartData, tableData, width,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const subscriptionsProps = {
            themeName,
            height,
            width,
            chartData,
            tableData,
            inProgress,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Subscriptions Analytics widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMSubscriptionsAnalytics
                                {...subscriptionsProps}
                                handleOnClickAPI={this.handleOnClickAPI}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMSubscriptionsAnalytics', APIMSubscriptionsAnalyticsWidget);
