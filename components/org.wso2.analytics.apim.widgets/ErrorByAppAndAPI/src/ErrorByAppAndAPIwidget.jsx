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
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import ErrorsSummaryChart from './ErrorsSummaryChart';
import { ViewTypeEnum } from '../../AppAndAPIErrorTable/src/Constants';

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
 * Create React Component for ErrorByAppAndAPI
 * @class ErrorByAppAndAPIwidget
 * @extends {Widget}
 */
class ErrorByAppAndAPIwidget extends Widget {
    /**
     * Creates an instance of ErrorByAppAndAPIwidget.
     * @param {any} props @inheritDoc
     * @memberof ErrorByAppAndAPIwidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            alertCount: null,
            apiErrors: [],
            totalApiErrors: null,
            appErrors: [],
            totalAppErrors: null,
            totalRequestCounts: 0,

            data4XX: [],
            total4XX: 0,
            data5XX: [],
            total5XX: 0,
            dataFaulty: [],
            totalFaulty: 0,
            dataThrottled: [],
            totalThrottled: 0,

            viewType: ViewTypeEnum.API,
            selectedLimit: 10,
        };

        this.styles = {
            // Insert styles Here
            mainDiv: {
                backgroundColor: '#0e1e33',
                padding: '20px',
            },
            h3: {
                borderBottom: '1px solid #fff',
                paddingBottom: '10px',
                margin: 'auto',
                marginTop: 0,
                textAlign: 'left',
                fontWeight: 'normal',
                letterSpacing: 1.5,
            },
            headingWrapper: {
                margin: 'auto',
                width: '95%',
            },
            dataWrapper: {
                margin: 'auto',
                height: '500px',
            },
            title: {
                textAlign: 'center',
                marginTop: '100px',
                marginBottom: '50px',
                fontWeight: 'bold',
                letterSpacing: 1.5,
            },
            content: {
                marginTop: '20px',
                textAlign: 'center',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleTotalRequestQuery = this.assembleTotalRequestQuery.bind(this);
        this.handleTotalRequestResults = this.handleTotalRequestResults.bind(this);

        this.assemble4xxTotalDataQuery = this.assemble4xxTotalDataQuery.bind(this);
        this.handle4xxTotalDataResults = this.handle4xxTotalDataResults.bind(this);
        this.assemble4xxDataQuery = this.assemble4xxDataQuery.bind(this);
        this.handle4xxDataQueryResults = this.handle4xxDataQueryResults.bind(this);

        this.assemble5xxTotalDataQuery = this.assemble5xxTotalDataQuery.bind(this);
        this.handle5xxTotalDataResults = this.handle5xxTotalDataResults.bind(this);
        this.assemble5xxDataQuery = this.assemble5xxDataQuery.bind(this);
        this.handle5xxDataQueryResults = this.handle5xxDataQueryResults.bind(this);

        this.assembleFaultyTotalDataQuery = this.assembleFaultyTotalDataQuery.bind(this);
        this.handleFaultyTotalDataResults = this.handleFaultyTotalDataResults.bind(this);
        this.assembleFaultyDataQuery = this.assembleFaultyDataQuery.bind(this);
        this.handleFaultyDataQueryResults = this.handleFaultyDataQueryResults.bind(this);

        this.assembleThrottledTotalDataQuery = this.assembleThrottledTotalDataQuery.bind(this);
        this.handleThrottledTotalDataResults = this.handleThrottledTotalDataResults.bind(this);
        this.assembleThrottledDataQuery = this.assembleThrottledDataQuery.bind(this);
        this.handleThrottledDataQueryResults = this.handleThrottledDataQueryResults.bind(this);

        this.loadAllErrors = this.loadAllErrors.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
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
        // This function retrieves the provider configuration defined in the widgetConf.json file and make
        // it available to be used inside the widget
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
      * Load locale file
      * @param {string} locale Locale name
      * @memberof ErrorByAppAndAPIwidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/ErrorByAppAndAPI/locales/${locale}.json`)
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
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberof ErrorByAppAndAPIwidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            // Insert the code to handle publisher data
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleTotalRequestQuery);
    }

    assembleTotalRequestQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{selectPhase}}': '(sum(successCount) + sum(faultCount) + sum(throttledCount)) as count',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_total', widgetName, this.handleTotalRequestResults, dataProviderConfigs);

    }

    handleTotalRequestResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const totalRequestCounts = data[0];
        if (data.length !== 0) {
            this.setState({ totalRequestCounts }, this.loadAllErrors);
        } else {
            this.setState(
                {
                    totalRequestCounts: 0,
                    data4XX: [],
                    total4XX: 0,
                    data5XX: [],
                    total5XX: 0,
                    dataFaulty: [],
                    totalFaulty: 0,
                    dataThrottled: [],
                    totalThrottled: 0,
                },
            );
        }
    }

    //
    loadAllErrors() {
        this.assemble4xxTotalDataQuery();
        this.assemble5xxTotalDataQuery();
        this.assembleFaultyTotalDataQuery();
        this.assembleThrottledTotalDataQuery();
    }

    // 4xx
    assemble4xxTotalDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{selectPhase}}': 'sum(_4xx) as count',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_4xx_total', widgetName, this.handle4xxTotalDataResults, dataProviderConfigs);
    }

    handle4xxTotalDataResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const total4XX = data[0];
        if (data.length !== 0) {
            this.setState({ total4XX }, this.assemble4xxDataQuery);
        } else {
            this.setState({ total4XX: 0, data4XX: [] });
        }
    }

    assemble4xxDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, viewType, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let selectPhase = 'apiName, sum(_4xx) as count';
        let groupByPhase = 'apiName';
        if (viewType === ViewTypeEnum.APP) {
            selectPhase = 'applicationName, applicationOwner, sum(_4xx) as count';
            groupByPhase = 'applicationName, applicationOwner';
        }
        dataProviderConfigs.configs.config.queryData.queryName = 'errorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{querystring}}': 'and _4xx > 0',
            '{{selectPhase}}': selectPhase,
            '{{groupByPhase}}': groupByPhase,
            '{{orderBy}}': 'order by count desc',
            '{{limit}}': selectedLimit,
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_4xx', widgetName, this.handle4xxDataQueryResults, dataProviderConfigs);
    }

    handle4xxDataQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const { viewType } = this.state;
        let errorData = [];
        if (viewType === ViewTypeEnum.APP) {
            errorData = data.map((item) => {
                return { x: item[0] + ' ( ' + item[1] + ' )', y: item[2] };
            });
        } else {
            errorData = data.map((item) => {
                return { x: item[0], y: item[1] };
            });
        }
        if (data.length !== 0) {
            this.setState({ data4XX: errorData });
        } else {
            this.setState({ data4XX: [] });
        }
    }

    // 5xx
    assemble5xxTotalDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{selectPhase}}': 'sum(_5xx) as count',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_5xx_total', widgetName, this.handle5xxTotalDataResults, dataProviderConfigs);
    }

    handle5xxTotalDataResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const total5XX = data[0];
        if (data.length !== 0) {
            this.setState({ total5XX }, this.assemble5xxDataQuery);
        } else {
            this.setState({ total5XX: 0, data5XX: [] });
        }
    }

    assemble5xxDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, viewType, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let selectPhase = 'apiName, sum(_5xx) as count';
        let groupByPhase = 'apiName';
        if (viewType === ViewTypeEnum.APP) {
            selectPhase = 'applicationName, applicationOwner, sum(_5xx) as count';
            groupByPhase = 'applicationName, applicationOwner';
        }
        dataProviderConfigs.configs.config.queryData.queryName = 'errorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{querystring}}': 'and _5xx > 0',
            '{{selectPhase}}': selectPhase,
            '{{groupByPhase}}': groupByPhase,
            '{{orderBy}}': 'order by count desc',
            '{{limit}}': selectedLimit,
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_5xx', widgetName, this.handle5xxDataQueryResults, dataProviderConfigs);
    }

    handle5xxDataQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const { viewType } = this.state;
        let errorData = [];
        if (viewType === ViewTypeEnum.APP) {
            errorData = data.map((item) => {
                return { x: item[0] + ' ( ' + item[1] + ' )', y: item[2] };
            });
        } else {
            errorData = data.map((item) => {
                return { x: item[0], y: item[1] };
            });
        }
        if (data.length !== 0) {
            this.setState({ data5XX: errorData });
        } else {
            this.setState({ data5XX: [] });
        }
    }

    // fault
    assembleFaultyTotalDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{selectPhase}}': 'sum(faultCount) as count',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_faulty_total', widgetName, this.handleFaultyTotalDataResults, dataProviderConfigs);
    }

    handleFaultyTotalDataResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const totalFaulty = data[0];
        if (data.length !== 0) {
            this.setState({ totalFaulty }, this.assembleFaultyDataQuery);
        } else {
            this.setState({ totalFaulty: 0, dataFaulty: [] });
        }
    }

    assembleFaultyDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, viewType, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let selectPhase = 'apiName, sum(faultCount) as count';
        let groupByPhase = 'apiName';
        if (viewType === ViewTypeEnum.APP) {
            selectPhase = 'applicationName, applicationOwner, sum(faultCount) as count';
            groupByPhase = 'applicationName, applicationOwner';
        }
        dataProviderConfigs.configs.config.queryData.queryName = 'errorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{querystring}}': 'and faultCount > 0',
            '{{selectPhase}}': selectPhase,
            '{{groupByPhase}}': groupByPhase,
            '{{orderBy}}': 'order by count desc',
            '{{limit}}': selectedLimit,
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_faulty', widgetName, this.handleFaultyDataQueryResults, dataProviderConfigs);
    }

    handleFaultyDataQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const { viewType } = this.state;
        let errorData = [];
        if (viewType === ViewTypeEnum.APP) {
            errorData = data.map((item) => {
                return { x: item[0] + ' ( ' + item[1] + ' )', y: item[2] };
            });
        } else {
            errorData = data.map((item) => {
                return { x: item[0], y: item[1] };
            });
        }
        if (data.length !== 0) {
            this.setState({ dataFaulty: errorData });
        } else {
            this.setState({ dataFaulty: [] });
        }
    }

    // fault
    assembleThrottledTotalDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalErrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{selectPhase}}': 'sum(throttledCount) as count',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_throttled_total', widgetName, this.handleThrottledTotalDataResults,
                dataProviderConfigs);
    }

    handleThrottledTotalDataResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const totalThrottled = data[0];
        if (data.length !== 0) {
            this.setState({ totalThrottled }, this.assembleThrottledDataQuery);
        } else {
            this.setState({ totalThrottled: 0, dataThrottled: [] });
        }
    }

    assembleThrottledDataQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, viewType, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let selectPhase = 'apiName, sum(throttledCount) as count';
        let groupByPhase = 'apiName';
        if (viewType === ViewTypeEnum.APP) {
            selectPhase = 'applicationName, applicationOwner, sum(throttledCount) as count';
            groupByPhase = 'applicationName, applicationOwner';
        }
        dataProviderConfigs.configs.config.queryData.queryName = 'errorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{querystring}}': 'and throttledCount > 0',
            '{{selectPhase}}': selectPhase,
            '{{groupByPhase}}': groupByPhase,
            '{{orderBy}}': 'order by count desc',
            '{{limit}}': selectedLimit,
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_throttle', widgetName, this.handleThrottledDataQueryResults, dataProviderConfigs);
    }

    handleThrottledDataQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data } = message;
        const { viewType } = this.state;
        let errorData = [];
        if (viewType === ViewTypeEnum.APP) {
            errorData = data.map((item) => {
                return { x: item[0] + ' ( ' + item[1] + ' )', y: item[2] };
            });
        } else {
            errorData = data.map((item) => {
                return { x: item[0], y: item[1] };
            });
        }
        if (data.length !== 0) {
            this.setState({ dataThrottled: errorData });
        } else {
            this.setState({ dataThrottled: [] });
        }
    }

    handleViewChange(event) {
        this.setState({ viewType: event.target.value }, this.loadAllErrors);
    }

    handleLimitChange(event) {
        this.setState({ selectedLimit: event.target.value }, this.loadAllErrors);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the ErrorByAppAndAPIwidget
     * @memberof ErrorByAppAndAPIwidget
     */
    render() {
        const { localeMessages } = this.state;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <div style={this.styles.mainDiv}>
                        <div style={this.styles.headingWrapper}>
                            <h3 style={this.styles.h3}>
                                <FormattedMessage
                                    id='widget.heading'
                                    defaultMessage='SAMPLE HEADING'
                                />
                            </h3>
                            <ErrorsSummaryChart
                                {...this.state}
                                handleViewChange={this.handleViewChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        </div>
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('ErrorByAppAndAPI', ErrorByAppAndAPIwidget);
