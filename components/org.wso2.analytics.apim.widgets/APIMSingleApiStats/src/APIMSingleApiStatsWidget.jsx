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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMSingleApiStats from './APIMSingleApiStats';

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
const queryParamKey = 'recentapistats';

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
 * Create React Component for APIM Api Single Api Stats Widget
 * @class APIMSingleApiStatsWidget
 * @extends {Widget}
 */
class APIMSingleApiStatsWidget extends Widget {
    /**
     * Creates an instance of APIMSingleApiStatsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMSingleApiStatsWidget
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
            inProgress: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            usageData: null,
            localeMessages: null,
            data: null,
            apiname: null,
            apiVersion: null,
            totalRequestCount: null,
            trafficData: null,
            totalLatencyCount: null,
            latencyData: null,
            totalErrorCount: null,
            errorData: null,
            averageLatency: null,
            errorPercentage: null,
            resourceRequestCount: null,
            sortedData: null,
            formattedErrorPercentage: null,
            xAxisTicks: null,
            errorCountxAxisTicks: null,
            inProgress: true,
            urlAvailable: true,
            apiList: [],
            apiSelected: null,
            trafficDataArray: [],
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.assembleLatencyQuery = this.assembleLatencyQuery.bind(this);
        this.handleLatencyReceived = this.handleLatencyReceived.bind(this);
        this.assembleErrorsQuery = this.assembleErrorsQuery.bind(this);
        this.handlEerrorsReceived = this.handlEerrorsReceived.bind(this);
        this.errorPercentageQuery = this.errorPercentageQuery.bind(this);
        this.handlerrorRateReceived = this.handlerrorRateReceived.bind(this);
        this.assembleTotalRequestCountQuery = this.assembleTotalRequestCountQuery.bind(this);
        this.handleTotalRequestCountReceived = this.handleTotalRequestCountReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.loadUrlData = this.loadUrlData.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getApiList = this.getApiList.bind(this);
        this.analyzeErrorRate = this.analyzeErrorRate.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
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
        this.loadUrlData();

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
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMSingleApiStatsWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMSingleApiStats/locales/${locale}.json`)
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
     * Load the Api name and version passed via url
     * @memberof APIMSingleApiStatsWidget
     * */
    loadUrlData() {
        const queryParam = super.getGlobalState('apidata');
        if (typeof queryParam.apiName === 'undefined') {
            this.setState({ urlAvailable: false });
        } else {
            this.setState({
                apiname: queryParam.apiName,
                apiVersion: queryParam.apiVersion,
                urlAvailable: true,
                apiSelected: queryParam.apiName + ':' + queryParam.apiVersion,
            });
        }
    }

    /**
     * Retreive Api list
     * @memberof APIMSingleApiStatsWidget
     */
    getApiList() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiListQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from getApiList query
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { urlAvailable } = this.state;
        const apiarray = [];

        data.forEach((element) => {
            apiarray.push(element[0] + ':' + element[1]);
        });

        if (data && data.length > 0) {
            if (urlAvailable) {
                this.setState({ apiList: apiarray });
                this.assembleApiUsageQuery();
            } else {
                this.setState({ apiList: apiarray });
                this.setState({
                    apiname: data[0][0],
                    apiVersion: data[0][1],
                    apiSelected: data[0][0] + ':' + data[0][1],
                });
                this.assembleApiUsageQuery();
            }
        } else {
            this.setState({ apiList: apiarray, inProgress: false });
        }
    }

    /**
     * Set url availability to query parameter key
     * @param {boolean} urlAvailable check Passing Api name and Version
     * @memberof APIMSingleApiStatsWidget
     */
    setQueryParam(urlAvailable) {
        super.setGlobalState(queryParamKey, { urlAvailable });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @param {object} receivedMsg timeFrom, TimeTo, perValue
     * @memberof APIMSingleApiStatsWidget
    */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.getApiList);
    }

    /**
     * Retreive total traffic for Apis group by Aggregation Timestamp
     * @memberof APIMSingleApiStatsWidget
     */
    assembleApiUsageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, apiname, apiVersion,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'trafficQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiUsageReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiUsageQuery
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handleApiUsageReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            const trafficData = [];
            const xAxisTicks = [];
            let totalRequestCount = 0;

            data.forEach((dataUnit) => {
                trafficData.push({
                    x: new Date(dataUnit[1]).getTime(),
                    y: dataUnit[2],
                });
                totalRequestCount += dataUnit[2];
            });

            const first = new Date(trafficData[0].x).getTime();
            const last = new Date(trafficData[trafficData.length - 1].x).getTime();
            const interval = (last - first) / 4;
            let duration = 0;
            xAxisTicks.push(first);
            for (let i = 1; i <= 4; i++) {
                duration = interval * i;
                xAxisTicks.push(new Date(first + duration).getTime());
            }

            this.setState({
                trafficData, xAxisTicks, totalRequestCount,
            });
        } else {
            this.setState({ totalRequestCount: 0, trafficData: [] });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleLatencyQuery();
    }

    /**
     * Retreive total traffic for Apis group by Aggregation Timestamp
     * @memberof APIMSingleApiStatsWidget
     */
    assembleLatencyQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, apiname, apiVersion,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'latencyQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleLatencyReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleLatencyQuery
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handleLatencyReceived(message) {
        const { data } = message;
        const { id } = this.props;
        if (data.length !== 0) {
            const latencyData = [];
            let totalLatencyCount = 0;
            let totallatencytime = 0;
            let averageLatency = 0;

            data.forEach((e) => {
                totalLatencyCount += e[2];
                latencyData.push({
                    x: new Date(e[1]).getTime(),
                    y: (e[3] / e[2]),
                });
                totallatencytime += e[3];
            });

            averageLatency = Math.floor(totallatencytime / totalLatencyCount);
            this.setState({ latencyData, averageLatency });
        } else {
            this.setState({ latencyData: [], averageLatency: 0 });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleErrorsQuery();
    }

    /**
     * Retreive total errors for Apis group by Aggregation Timestamp
     * @memberof APIMSingleApiStatsWidget
     */
    assembleErrorsQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, apiname, apiVersion,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'errorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handlEerrorsReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleErrorsQuery
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handlEerrorsReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            const errorData = [];
            const errorCountxAxisTicks = [];
            let totalErrorCount = 0;

            data.forEach((e) => {
                totalErrorCount += e[2];
                errorData.push({
                    x: new Date(e[3]).getTime(),
                    y: (e[2]),
                });
            });

            const first = new Date(errorData[0].x).getTime();
            const last = new Date(errorData[errorData.length - 1].x).getTime();
            const interval = (last - first) / 4;
            let duration = 0;
            errorCountxAxisTicks.push(first);
            for (let i = 1; i <= 4; i++) {
                duration = interval * i;
                errorCountxAxisTicks.push(new Date(first + duration).getTime());
            }
            this.setState({ totalErrorCount, errorData, errorCountxAxisTicks });
        } else {
            this.setState({ totalErrorCount: 0, errorData: [] });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.errorPercentageQuery();
    }

    /**
     * Retreive error count group by Resource template
     * @memberof APIMSingleApiStatsWidget
     */
    errorPercentageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, apiname, apiVersion,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handlerrorRateReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from errorPercentageQuery
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handlerrorRateReceived(message) {
        const { data } = message;
        const { id } = this.props;

        this.setState({ errorPercentage: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTotalRequestCountQuery();
    }


    /**
     * Retreive total request count group by Api Resource template
     * @memberof APIMSingleApiStatsWidget
     */
    assembleTotalRequestCountQuery() {
        const {
            timeFrom, timeTo, providerConfig, perValue, apiname, apiVersion,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalReqCountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalRequestCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleTotalRequestCountQuery
     * @param {object} message - data retrieved
     * @memberof APIMSingleApiStatsWidget
     * */
    handleTotalRequestCountReceived(message) {
        const { data } = message;
        const { id } = this.props;

        this.setState({ resourceRequestCount: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzeErrorRate();
    }

    /**
     * Analyze the error count received
     * @memberof APIMSingleApiStatsWidget
     */
    analyzeErrorRate() {
        const { errorPercentage, resourceRequestCount } = this.state;
        const sortedData = [];
        let totalhits = 0;
        let totalerrors = 0;
        let errorpercentage = 0;

        totalerrors = errorPercentage.reduce((totalCount, dataUnit) => totalCount + dataUnit[1], 0);
        totalhits = resourceRequestCount.reduce((totalCount, dataUnit) => totalCount + dataUnit[1], 0);
        errorpercentage = ((totalerrors / totalhits) * 100).toPrecision(3);

        errorPercentage.forEach((dataUnit) => {
            resourceRequestCount.forEach((request) => {
                if (dataUnit[0] === request[0]) {
                    const percentage = (request[1] / dataUnit[1]) * 100;
                    sortedData.push({
                        x: '( ' + request[0] + ' ) ' + percentage.toPrecision(3) + '%', y: percentage,
                    });
                }
            });
        });

        if (errorpercentage.length === 0 || isNaN(errorpercentage)) {
            this.setState({ sortedData, formattedErrorPercentage: 0 });
        } else {
            this.setState({ sortedData, formattedErrorPercentage: errorpercentage, inProgress: false });
        }
    }

    /**
     * Handle Selected API
     * @param {Event} event - listened event
     * @memberof APIMSingleApiStatsWidget
     * */
    apiSelectedHandleChange(event) {
        const stringArray = event.target.value.split(':');
        this.setState({
            apiname: stringArray[0],
            apiVersion: stringArray[1],
            urlAvailable: true,
            apiSelected: event.target.value,
            inProgress: true,
        });
        this.getApiList();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Single Api Stats Widget
     * @memberof APIMSingleApiStatsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiname, apiVersion, totalRequestCount,
            trafficData, latencyData, totalLatencyCount, timeFrom, timeTo, totalErrorCount,
            errorData, averageLatency, formattedErrorPercentage, sortedData, inProgress, apiList,
            apiSelected, xAxisTicks, errorCountxAxisTicks,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName,
            height,
            trafficData,
            apiname,
            apiVersion,
            totalRequestCount,
            latencyData,
            totalLatencyCount,
            timeFrom,
            timeTo,
            totalErrorCount,
            errorData,
            averageLatency,
            formattedErrorPercentage,
            sortedData,
            apiList,
            apiSelected,
            inProgress,
            xAxisTicks,
            errorCountxAxisTicks,
        };

        return (
            <IntlProvider
                locale={languageWithoutRegionCode}
                messages={localeMessages}
            >
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography
                                        variant='h5'
                                        component='h3'
                                    >
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Single Api Stats widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMSingleApiStats
                                {...apiUsageProps}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMSingleApiStats', APIMSingleApiStatsWidget);
