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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import APIMAlertSummary from './APIMAlertSummary';

const darkTheme = createMuiTheme({
    useNextVariants: true,
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    useNextVariants: true,
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

const queryParamKey = 'alertSummary';

const API_CALLBACK = '-api';
const ALERT_CALLBACK = '-alert';

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
 * Create react component for the APIM Alert Summary widget
 * @class APIMAlertSummaryWidget
 * @extends {Widget}
 */
class APIMAlertSummaryWidget extends Widget {
    /**
     * Creates an instance of APIMAlertSummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMAlertSummaryWidget
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
            alertData: [],
            refreshInterval: 60000, // 1min
            refreshIntervalId: null,
            localeMessages: null,
            inProgress: true,
            apiList: [],
            selectedApi: 'All',
            timeFrom: null,
            timeTo: null,
            limit: 5,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleApiAlerts = this.assembleApiAlerts.bind(this);
        this.handleApiAlertsReceived = this.handleApiAlertsReceived.bind(this);
        this.assembleApiList = this.assembleApiList.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleApiChange = this.handleApiChange.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.setQueryParam = this.setQueryParam.bind(this);
        this.loadQueryParam = this.loadQueryParam.bind(this);
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
        const { refreshInterval } = this.state;
        this.loadQueryParam();

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refresh = () => {
                    this.assembleApiAlerts();
                };
                const refreshIntervalId = setInterval(refresh, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                    refreshIntervalId,
                }, () => {
                    this.assembleApiList();
                    super.subscribe(this.handlePublisherParameters);
                });
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
        const { refreshIntervalId } = this.state;
        clearInterval(refreshIntervalId);
        super.getWidgetChannelManager().unsubscribeWidget(id + API_CALLBACK);
        super.getWidgetChannelManager().unsubscribeWidget(id + ALERT_CALLBACK);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMAlertSummaryWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMAlertSummary/locales/${locale}.json`)
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
     * @memberof APIMApiUsageWidget
     * */
    loadQueryParam() {
        let { limit, selectedApi } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        if (!selectedApi) {
            selectedApi = 'All';
        }
        this.setQueryParam(selectedApi, limit);
        this.setState({ selectedApi, limit });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMAlertSummaryWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const { from, to, selectedApi } = receivedMsg;

        if (selectedApi && from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                inProgress: true,
                selectedApi,
            }, this.assembleApiAlerts);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                inProgress: !sync,
            }, this.assembleApiAlerts);
        } else if (selectedApi) {
            this.setState({
                inProgress: true,
                selectedApi,
            }, this.assembleApiAlerts);
        }
    }

    /**
     * Retrieve the API list
     * @memberof APIMAlertSummaryWidget
     * */
    assembleApiList() {
        const { id, widgetID: widgetName } = this.props;
        const { providerConfig } = this.state;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiquery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + API_CALLBACK, widgetName, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleApiList query
     * @param {object} message - data retrieved
     * @memberof APIMAlertSummaryWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const { limit } = this.state;
        let { selectedApi } = { ...this.state };

        if (data && data.length > 0) {
            let apiList = data.map((dataUnit) => { return dataUnit[0]; });
            apiList = Array.from(new Set(apiList));
            apiList.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
            apiList.unshift('All');

            if (!apiList.includes(selectedApi)) {
                selectedApi = 'All';
                this.setQueryParam(selectedApi, limit);
            }
            this.setState({ apiList, selectedApi }, this.assembleApiAlerts);
        } else {
            this.setState({ alertData: [], apiList: [], inProgress: false });
        }
    }

    /**
     * Retrieve the API info for sub rows
     * @memberof APIMAlertSummaryWidget
     * */
    assembleApiAlerts() {
        const { id, widgetID: widgetName } = this.props;
        const {
            timeFrom, timeTo, providerConfig, selectedApi, limit,
        } = this.state;

        if (timeFrom) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'alertquery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{timeFrom}}': timeFrom,
                '{{timeTo}}': timeTo,
                '{{apiName}}': selectedApi !== 'All' ? 'AND apiName == \'' + selectedApi + '\'' : '',
                '{{limit}}': limit,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + ALERT_CALLBACK, widgetName, this.handleApiAlertsReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleApiSubInfo query
     * @param {object} message - data retrieved
     * @memberof APIMAlertSummaryWidget
     * */
    handleApiAlertsReceived(message) {
        const { data } = message;

        if (data && data.length > 0) {
            const alertData = data.map((dataUnit) => {
                const severityData = this.getSeverityLevel(dataUnit[2]);
                return {
                    apiname: dataUnit[0],
                    type: dataUnit[1],
                    severity: severityData.text,
                    severityColor: severityData.color,
                    details: dataUnit[3],
                    time: Moment(dataUnit[4]).format('YYYY-MMM-DD hh:mm:ss A'),
                };
            });
            this.setState({ alertData, inProgress: false });
        } else {
            this.setState({ alertData: [], inProgress: false });
        }
    }

    /**
     * Get severity level
     * @param {String} severity - severity value
     * @memberof APIMAlertSummaryWidget
     * */
    getSeverityLevel(severity) {
        let color = '';
        let text = '';

        switch (severity) {
            case 1:
                color = '#777777';
                text = 'mild';
                break;
            case 2:
                color = '#ff9800';
                text = 'moderate';
                break;
            case 3:
                color = '#b71c1c';
                text = 'severe';
                break;
            default:
            //        not reached
        }
        return { color, text };
    }

    /**
     * Handle onChange of selected api
     * @param {String} value - selected api
     * @memberof APIMAlertSummaryWidget
     * */
    handleApiChange(value) {
        const { limit } = this.state;
        this.setQueryParam(value, limit);
        this.setState({ selectedApi: value, inProgress: true }, this.assembleApiAlerts);
    }

    /**
     * Handle limit  Change
     * @param {Event} event - listened event
     * @memberof APIMAlertSummaryWidget
     * */
    handleLimitChange(event) {
        const { selectedApi } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(selectedApi, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleApiAlerts);
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Updates query param values
     * @param {String} selectedApi - selected api
     * @param {String} limit - limit
     * @memberof APIMAlertSummaryWidget
     * */
    setQueryParam(selectedApi, limit) {
        super.setGlobalState(queryParamKey, { selectedApi, limit });
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Alert Summary widget
     * @memberof APIMAlertSummaryWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, alertData, inProgress, selectedApi, apiList, limit,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiAlertProps = {
            themeName, height, alertData, inProgress, selectedApi, apiList, limit,
        };

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    <div id='alert-summary'>
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
                                                defaultMessage={'Cannot fetch provider configuration for APIM Alert '
                                            + 'Summary Widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <APIMAlertSummary
                                    {...apiAlertProps}
                                    handleApiChange={this.handleApiChange}
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

global.dashboard.registerWidget('APIMAlertSummary', APIMAlertSummaryWidget);
