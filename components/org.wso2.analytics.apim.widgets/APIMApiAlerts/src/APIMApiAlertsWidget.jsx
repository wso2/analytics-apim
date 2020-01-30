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
import APIMApiAlerts from './APIMApiAlerts';

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
 * Widget for displaying total alerts for APIs
 * @class APIMApiAlertsWidget
 * @extends {Widget}
 */
class APIMApiAlertsWidget extends Widget {
    /**
     * Creates an instance of APIMApiAlertsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiAlertsWidget
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
            localeMessages: null,
            backendAlert: null,
            responseAlert: null,
            requestAlerts: null,
            sortedArray: null,
            finalDataSet: null,
            totalCount: null,
            inProgress: true,
            legandDataSet: null,
            tableDataSet: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }
        this.assembleAlertQuery = this.assembleAlertQuery.bind(this);
        this.assembleRequestAlertReceived = this.assembleRequestAlertReceived.bind(this);
        this.assembleResponseAlertQuery = this.assembleResponseAlertQuery.bind(this);
        this.assembleResponseAlertReceived = this.assembleResponseAlertReceived.bind(this);
        this.assembleBackendAlertQuery = this.assembleBackendAlertQuery.bind(this);
        this.assembleBackendAlertReceived = this.assembleBackendAlertReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.analyzeAlertData = this.analyzeAlertData.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.convertToJsonObject = this.convertToJsonObject.bind(this);
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
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMApiAlertsWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiAlerts/locales/${locale}.json`)
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
     * @memberof APIMApiAlertsWidget
   */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            inProgress: !sync,
        }, this.assembleAlertQuery);
    }

    /**
     * Retrieve No of abnormal request count alerts, for APIs
     * @memberof APIMApiAlertsWidget
     * */
    assembleAlertQuery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.incrementalColumn = 'requestCountPerMin';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalReqAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{Domain}}': 'tenantDomain',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assembleRequestAlertReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleAlertQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiAlertsWidget
     * */
    assembleRequestAlertReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ requestAlerts: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleResponseAlertQuery();
    }

    /**
     * Retrieve No of response alert count, for APIs
     * @memberof APIMApiAlertsWidget
     * */
    assembleResponseAlertQuery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.incrementalColumn = 'responseTime';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalResponseTimeAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{Domain}}': 'apiCreatorTenantDomain',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assembleResponseAlertReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleResponseAlertQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiAlertsWidget
     * */
    assembleResponseAlertReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ responseAlert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleBackendAlertQuery();
    }

    /**
    * Retrieve No of abnormal backend alert count, for APIs
    * @memberof APIMApiAlertsWidget
    * */
    assembleBackendAlertQuery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.incrementalColumn = 'backendTime';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalBackendTimeAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{Domain}}': 'apiCreatorTenantDomain',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assembleBackendAlertReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleBackendAlertQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiAlertsWidget
     * */
    assembleBackendAlertReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ backendAlert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzeAlertData();
    }

    /**
    * Analyze the total errors received
    * @memberof APIMApiAlertsWidget
    * */
    analyzeAlertData() {
        const { backendAlert, responseAlert, requestAlerts } = this.state;
        const allAlerts = [...backendAlert, ...responseAlert, ...requestAlerts];
        const alertMap = [];
        const finalArray = [];
        let totalAlertCount = 0;

        allAlerts.forEach((alert) => {
            const filteredAlerts = allAlerts.filter(data => data[0] === alert[0] && data[2] === alert[2]);
            if (!alertMap.includes(alert[0] + ':::' + alert[2])) {
                alertMap.push(alert[0] + ':::' + alert[2]);
                const count = filteredAlerts.reduce((totalCount, dataUnit) => totalCount + dataUnit[1], 0);
                finalArray.push([alert[0], count, alert[2]]);
            }
        });

        finalArray.forEach((element) => {
            totalAlertCount += element[1];
        });

        this.setState({ sortedArray: finalArray, totalCount: totalAlertCount });
        this.convertToJsonObject();
    }

    /**
     * Convert the final dataset to json object
     * @memberof APIMApiAlertsWidget
     * */
    convertToJsonObject() {
        const { sortedArray } = this.state;
        let { finalDataSet, legandDataSet, tableDataSet } = [];

        finalDataSet = sortedArray.map((data) => {
            return {
                apiName: data[0] + '(' + data[2] + ')' + data[1],
                hits: data[1],
            };
        });
        legandDataSet = sortedArray.map((legandData) => {
            return {
                name: legandData[0] + '(' + legandData[2] + ')',
            };
        });
        tableDataSet = sortedArray.map((sortedData) => {
            return {
                name: sortedData[0],
                version: sortedData[2],
                hits: sortedData[1],
            };
        });

        this.setState({
            finalDataSet, tableDataSet, inProgress: false, legandDataSet,
        });
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Alerts widget
     * @memberof APIMApiAlertsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConf, height, width, finalDataSet, totalCount,
            inProgress, legandDataSet, tableDataSet,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apialertProps = {
            themeName, finalDataSet, totalCount, width, height, inProgress, legandDataSet, tableDataSet,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConf ? (
                            <div style={paperWrapper}>
                                <Paper elevation={1} style={paper}>
                                    <Typography variant='h4' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Alerts Widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiAlerts {...apialertProps} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiAlerts', APIMApiAlertsWidget);
