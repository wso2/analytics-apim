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
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
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
            username: null,
            inProgress: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getUsername = this.getUsername.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
        this.getUsername();

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
     * Get username of the logged in user
     */
    getUsername() {
        let { username } = super.getCurrentUser();
        // if email username is enabled, then super tenants will be saved with '@carbon.super' suffix, else, they
        // are saved without tenant suffix
        if (username.split('@').length === 2) {
            username = username.replace('@carbon.super', '');
        }
        this.setState({ username })
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
        const { providerConfig, timeFrom, timeTo, username } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        let { createdBy } = queryParam;

        if (!createdBy || !(createdBy in createdByKeys)) {
            createdBy = createdByKeys.all;
            this.setState({ createdBy });
            this.setQueryParam(createdBy);
        }

        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'query';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{timeFrom}}': Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'),
            '{{timeTo}}': Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'),
            '{{createdBy}}': createdBy === createdByKeys.me ? "AND CREATED_BY='{{creator}}'" : '',
            '{{creator}}': username
        };
        super.getWidgetChannelManager().subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMApiCreatedAnalyticsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const { createdBy } = this.state;

        if (data && data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            // use apiCount to keep aggregate API created count
            let apiCount = 0;

            data.forEach((dataUnit) => {
                apiCount += dataUnit[4];
                chartData.push({
                    x: new Date(dataUnit[3]).getTime(),
                    y: apiCount,
                    label: 'CREATED_TIME:' + Moment(dataUnit[3])
                        .format('YYYY-MMM-DD hh:mm:ss A') + '\nCOUNT:' + apiCount,
                });
                tableData.push({
                    apiname: dataUnit[1] + ' (' + dataUnit[5] + ')',
                    apiVersion: dataUnit[2],
                    createdtime: Moment(dataUnit[3]).format('YYYY-MMM-DD hh:mm:ss A'),
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
                chartData, tableData, xAxisTicks, maxCount, inProgress: false
            });
        } else {
            this.setState({ inProgress: false, chartData: [], tableData: [] });
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
        const { id } = this.props;

        this.setQueryParam(event.target.value);
        this.setState({ createdBy: event.target.value, inProgress: true });
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
            inProgress
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiCreatedProps = {
            themeName, height, createdBy, chartData, tableData, xAxisTicks, maxCount, inProgress,
        };

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Created Analytics widget'}
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
