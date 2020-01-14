
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
import CircularProgress from '@material-ui/core/CircularProgress';
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
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apimapialerts';

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
 * Widget for displaying API alerts of APIs
 * @class APIMAppApiUsageWidget
 * @extends {Widget}
 */
class APIMApiAlertsWidget extends Widget {
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
            backendalert: null,
            responsealert: null,
            reqalert: null,
            sortedarray: null,
            finaldataset: null,
            totalcount: null,
            isloading: true,
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
        this.assemblereqalertquery = this.assemblereqalertquery.bind(this);
        this.assemblereqalertreceived = this.assemblereqalertreceived.bind(this);
        this.assembleresponsealertquery = this.assembleresponsealertquery.bind(this);
        this.assembleresponsealertreceived = this.assembleresponsealertreceived.bind(this);
        this.assemblebackendalertquery = this.assemblebackendalertquery.bind(this);
        this.assemblebackendalertreceived = this.assemblebackendalertreceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
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
     *
     * @param {string} locale Locale name
     * @memberof APIMApiAlertsWidget
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
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMApiAlertsWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            isloading: true,
            backendalert: null,
            responsealert: null,
            reqalert: null,
            sortedarray: null,
            finaldataset: null,
            totalcount: null,
        }, this.assemblereqalertquery);
    }
  
    /**
     * Retrieve No of abnormal request count alerts, for APIs
     * @memberof APIMApiAlertsWidget
     * */
    assemblereqalertquery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.tableName = 'ApimAbnormalReqAlert';
        dataProviderConfigs.configs.config.incrementalColumn = 'requestCountPerMin';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalReqAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
        };

        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assemblereqalertreceived, dataProviderConfigs);
    }


    /**
     * Format the data received
     * @memberof APIMApiAlertsWidget
     * */
    assemblereqalertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ reqalert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleresponsealertquery();
    }


     /**
     * Retrieve No of response alert count, for APIs
     * @memberof APIMApiAlertsWidget
     * */
    assembleresponsealertquery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.tableName = 'ApimAbnormalResponseTimeAlert';
        dataProviderConfigs.configs.config.incrementalColumn = 'responseTime';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalResponseTimeAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
        };

        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assembleresponsealertreceived, dataProviderConfigs);
    }

    /**
     * Format the data received
     * @memberof APIMApiAlertsWidget
     * */
    assembleresponsealertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ responsealert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assemblebackendalertquery();
    }

    /**
    * Retrieve No of abnormal backend alert count, for APIs
    * @memberof APIMApiAlertsWidget
    * */
    assemblebackendalertquery() {
        const { timeFrom, timeTo, providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.tableName = 'ApimAbnormalBackendTimeAlert';
        dataProviderConfigs.configs.config.incrementalColumn = 'backendTime';
        dataProviderConfigs.configs.config.queryData.queryName = 'alert';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{tableName}}': 'ApimAbnormalBackendTimeAlert',
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
        };

        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.assemblebackendalertreceived, dataProviderConfigs);
    }


    /**
     * Format the data received
     * @memberof APIMApiAlertsWidget
     * */
    assemblebackendalertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ backendalert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzealertdata();
    }


    /**
    * Analyze the total errors received
    * @memberof APIMApiAlertsWidget
    * */
    analyzealertdata() {
       var { backendalert, responsealert, reqalert } = this.state;
       let sortedarray = [];
       var totalcount = 0;

        if (backendalert != null) {
            for (var i in backendalert) {
                sortedarray.push(backendalert[i]);
            }
        }

        if (responsealert != null) {
            for (var i in responsealert) {
                var matchFoun = false;
                for (var n in sortedarray) {
                    if (responsealert[i][0] == sortedarray[n][0]) {
                        sortedarray[n][1] += responsealert[i][1];
                        matchFoun = true;
                        break;
                    }
                }
                if (matchFoun == false) {
                    sortedarray.push(responsealert[i]);
                }
            }
       }

        if (reqalert != null) {
            for (var i in reqalert) {
                var matchFoun = false;
                for (var n in sortedarray) {
                    if (reqalert[i][0] == sortedarray[n][0]) {
                        sortedarray[n][1] += reqalert[i][1];
                        matchFoun = true;
                        break;
                    }
                }
                if (matchFoun == false) {
                    sortedarray.push(reqalert[i]);
                }
            }
        }


        sortedarray.forEach((element) => {
            totalcount += element[1];
        });

       this.setState({ sortedarray, totalcount });
       this.sortedarray = null;
       this.converttojsonobject();
    }

    /**
     * Convert the final dataset to json object
     * @memberof APIMApiAlertsWidget
     * */
    converttojsonobject() {
        const { sortedarray } = this.state;
        let { finaldataset, legandDataSet, tableDataSet } = [];

        finaldataset = sortedarray.map((x) => {
            return{
                "apiName": x[0] +'(' + x[2] + ')'+ ' ' + x[1],
                "hits": x[1]
            };
        });

        legandDataSet = sortedarray.map((x) => {
            return{
                "name": x[0] +'(' + x[2] + ')'
            };
        });

        tableDataSet = sortedarray.map((x) => {
            return{
                "name": x[0],
                "version": x[2],
                "hits": x[1]
            };
        });

        
        this.setState({ finaldataset,tableDataSet, isloading: false, legandDataSet});
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Alerts widget
     * @memberof APIMApiAlertsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConf, height, width, finaldataset, totalcount, isloading,legandDataSet,tableDataSet
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apialertProps = { themeName, finaldataset, totalcount, width, height, isloading,legandDataSet,tableDataSet };

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
