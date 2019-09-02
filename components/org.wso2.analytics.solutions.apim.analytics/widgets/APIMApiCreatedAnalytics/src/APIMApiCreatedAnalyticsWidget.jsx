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
import Widget from '@wso2-dashboards/widget';
import Moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMApiCreatedAnalytics from './APIMApiCreatedAnalytics';

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
 * Query string parameter values
 * @type {object}
 */
const createdByKeys = {
    all: 'all',
    me: 'me',
};

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apis';

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
 * Create React Component for APIM Api Created Analytics
 * @class APIMApiCreatedAnalyticsWidget
 * @extends {Widget}
 */
class APIMApiCreatedAnalyticsWidget extends Widget {
    /**
     * Creates an instance of APIMApiCreatedAnalyticsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiCreatedAnalyticsWidget
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
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            createdBy: 'all',
            timeTo: null,
            timeFrom: null,
            chartData: null,
            tableData: null,
            xAxisTicks: null,
            maxCount: 0,
            localeMessages: null,
        };

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);

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
     * @memberof APIMApiCreatedAnalyticsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiCreatedAnalytics/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
        }, this.assembleQuery);
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    assembleQuery() {
        const { providerConfig, timeFrom, timeTo } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const currentUser = super.getCurrentUser().username;
        let { createdBy } = queryParam;
        if (!createdBy) {
            createdBy = createdByKeys.all;
        }

        this.setState({ createdBy, chartData: null, tableData: null });
        this.setQueryParam(createdBy);

        const { id } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let { query } = dataProviderConfigs.configs.config.queryData;
        query = query
            .replace('{{timeFrom}}', Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'))
            .replace('{{timeTo}}', Moment(timeTo).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'))
            .replace('{{querystring}}', createdBy === createdByKeys.me ? "AND CREATED_BY=='{{creator}}'" : '')
            .replace('{{creator}}', currentUser);
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { createdBy } = this.state;

        if (data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            let index = 0;

            data.forEach((dataUnit) => {
                chartData.push({
                    x: new Date(dataUnit[3]).getTime(),
                    y: dataUnit[4] + index,
                    label: 'CREATED_TIME:' + Moment(dataUnit[3])
                        .format('YYYY-MMM-DD hh:mm:ss') + '\nCOUNT:' + (dataUnit[4] + index++),
                });
                tableData.push({
                    id: index,
                    apiname: (dataUnit[1] + ' ' + dataUnit[2]).toString(),
                    createdtime: Moment(dataUnit[3]).format('YYYY-MMM-DD hh:mm:ss'),
                });
            });

            const maxCount = chartData[chartData.length - 1].y;

            const first = new Date(chartData[0].x).getTime();
            const last = new Date(chartData[chartData.length - 1].x).getTime();
            const interval = (last - first) / 10;
            let duration = 0;
            xAxisTicks.push(first);
            for (let i = 1; i <= 10; i++) {
                duration = interval * i;
                xAxisTicks.push(new Date(first + duration).getTime());
            }

            this.setState({
                chartData, tableData, xAxisTicks, maxCount,
            });
        }

        this.setQueryParam(createdBy);
    }

    /**
     * Updates query param values
     * @param {string} createdBy - API Created By menu option selected
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    setQueryParam(createdBy) {
        super.setGlobalState(queryParamKey, { createdBy });
    }

    /**
     * Handle Select Change
     * @param {Event} event - listened event
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    handleChange(event) {
        const queryParam = super.getGlobalState(queryParamKey);
        const { createdBy } = queryParam;
        const { id } = this.props;

        this.setQueryParam(event.target.value);
        this.setState({ createdBy });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Created Analytics widget
     * @memberof APIMApiCreatedAnalyticsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, createdBy, chartData, tableData, xAxisTicks, maxCount,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiCreatedProps = {
            themeName, height, createdBy, chartData, tableData, xAxisTicks, maxCount,
        };

        if (!localeMessages || !chartData || !tableData) {
            return (<CircularProgress style={loadingIcon} />);
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    {
                        faultyProviderConfig ? (
                            <div
                                style={paperWrapper}
                            >
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
                                            defaultMessage='Cannot fetch provider configuration for
                                             APIM Api Created Analytics widget'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiCreatedAnalytics {...apiCreatedProps} handleChange={this.handleChange} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiCreatedAnalytics', APIMApiCreatedAnalyticsWidget);
