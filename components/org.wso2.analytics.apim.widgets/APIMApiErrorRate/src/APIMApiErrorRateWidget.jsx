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
import APIMApiErrorRate from './APIMApiErrorRate';

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
 * Widget for displaying APIM Api Error Rate
 * @class APIMApiErrorRateWidget
 * @extends {Widget}
 */
class APIMApiErrorRateWidget extends Widget {
    /**
     * Creates an instance of APIMApiErrorRateWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiErrorRateWidget
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
            errorCount: null,
            totalRequestCount: null,
            localeMessages: null,
            sortedData: null,
            errorPercentage: null,
            inProgress: true,
            legendData: null,
            tableData: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleTotalRequestCount = this.assembleTotalRequestCount.bind(this);
        this.assembleTotalErrorCountQuery = this.assembleTotalErrorCountQuery.bind(this);
        this.handletotalRequestCountReceived = this.handletotalRequestCountReceived.bind(this);
        this.handleTotalErrorCountReceived = this.handleTotalErrorCountReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.analyzeErrorRate = this.analyzeErrorRate.bind(this);
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
                // eslint-disable-next-line no-console
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
      * @memberof APIMApiErrorRateWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiErrorRate/locales/${locale}.json`)
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
     * @param {object} receivedMsg timeFrom, TimeTo, perValue
     * @memberof APIMApiErrorRateWidget
   */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.assembleTotalErrorCountQuery);
    }

    /**
     * Retrieve total error count for APIs
     * @memberof APIMApiErrorRateWidget
     */
    assembleTotalErrorCountQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalerrorcountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        this.setState({ inProgress: true });
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalErrorCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleTotalErrorCountQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiErrorRateWidget
     * */
    handleTotalErrorCountReceived(message) {
        const { data } = message;
        const { id } = this.props;
        this.setState({ errorCount: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTotalRequestCount();
    }

    /**
     * Retrieve the total request count for APIs
     * @memberof APIMApiErrorRateWidget
     */
    assembleTotalRequestCount() {
        const {
            timeFrom, timeTo, providerConfig, perValue,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalReqCountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handletotalRequestCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleTotalRequestCount
     * @param {object} message - data retrieved
     * @memberof APIMApiErrorRateWidget
     * */
    handletotalRequestCountReceived(message) {
        const { data } = message;
        const { id } = this.props;
        this.setState({ totalRequestCount: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzeErrorRate();
    }

    /**
     * Calculate the error percentage
     * @memberof APIMApiErrorRateWidget
     */
    analyzeErrorRate() {
        const { errorCount, totalRequestCount } = this.state;
        const sortedData = [];
        const legendData = [];
        const tableData = [];
        let totalHits = 0;
        let totalErrors = 0;
        let errorPercentage = 0;

        totalHits = totalRequestCount.reduce((totalCount, dataUnit) => totalCount + dataUnit[2], 0);
        totalErrors = errorCount.reduce((totalCount, dataUnit) => totalCount + dataUnit[2], 0);
        errorPercentage = ((totalErrors / totalHits) * 100).toPrecision(3);

        totalRequestCount.forEach((dataUnit) => {
            errorCount.forEach((array) => {
                if (dataUnit[0] === array[0] && dataUnit[1] === array[1]) {
                    const percentage = (array[2] / dataUnit[2]) * 100;
                    sortedData.push({
                        x: array[0] + '(' + array[1] + ')' + percentage.toPrecision(3) + '%',
                        y: percentage,
                    });
                    legendData.push({
                        name: array[0] + '(' + array[1] + ')',
                    });
                    tableData.push({
                        apiName: array[0],
                        version: array[1],
                        count: percentage.toPrecision(3) + ' % ',
                    });
                }
            });
        });

        this.setState({
            sortedData, legendData, tableData, errorPercentage, inProgress: false,
        });
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIMApiErrorRateWidget
     * @memberof APIMApiErrorRateWidget
     */
    render() {
        const {
            width, height, localeMessages, faultyProviderConf, sortedData, errorPercentage,
            inProgress, legendData, tableData,
        } = this.state;
        const { paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiErrorRateProps = {
            width, height, themeName, sortedData, errorPercentage, legendData, tableData, inProgress,
        };

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConf ? (
                            <div style={paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography
                                        variant='h4'
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Error Rate Widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiErrorRate
                                {...apiErrorRateProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiErrorRate', APIMApiErrorRateWidget);
