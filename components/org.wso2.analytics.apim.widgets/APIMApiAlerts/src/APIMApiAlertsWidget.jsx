/* eslint-disable require-jsdoc */

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

const queryParamKey = 'apimapialerts';

const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];


class APIMApiAlertsWidget extends Widget {
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
            localeMessages: null,
            backendalert: null,
            responsealert: null,
            reqalert: null,
            sortedarray: null,
            finaldataset: null,
            totalcount: null,
            isloading: true,

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


    componentDidMount() {
        const { widgetID, id } = this.props;
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



    // Set the date time range
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
        //console.log(receivedMsg.from, receivedMsg.to);
    }


    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }


    // load the local file
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiAlerts/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }


    // format the siddhi query for abnormal request alert
    assemblereqalertquery() {
        const queryParam = super.getGlobalState(queryParamKey);
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


    // format the abnormal request alert received
    assemblereqalertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ reqalert: data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleresponsealertquery();
    }


    // format siddhi query for abnormal response alerts
    assembleresponsealertquery() {
        const queryParam = super.getGlobalState(queryParamKey);
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

    // format the abnormal response time alert
    assembleresponsealertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ responsealert: data });
            // console.log(data);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assemblebackendalertquery();
    }

    // format siddhi query for abnormal backend time alerts
    assemblebackendalertquery() {
        const queryParam = super.getGlobalState(queryParamKey);
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


    // format abnormal backend time alerts
    assemblebackendalertreceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ backendalert: data });
            // console.log(data);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzealertdata();
    }


    // analyze the total alert data received
    analyzealertdata() {
        var { backendalert, responsealert, reqalert } = this.state;
        
       console.log(backendalert, responsealert, reqalert);
       let sortedarray = [];
       var totalcount = 0;

        if (backendalert != null) {
            for (var i in backendalert) {
                sortedarray.push(backendalert[i]);
            }
        }

      //  console.log(sortedarray);
        if (responsealert != null) {
            for (var i in responsealert) {
                var matchFoun = false;
                for (var n in sortedarray) {
                    if (responsealert[i][0] == sortedarray[n][0]) {
                        console.log(sortedarray[n][1],responsealert[i][1]);
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

        console.log(sortedarray);
       this.setState({ sortedarray, totalcount });
       this.sortedarray = null;
       this.converttojsonobject();
    }

    // convert the dataset to json object
    converttojsonobject() {
        const { sortedarray } = this.state;
        let finaldataset = [];

        finaldataset = sortedarray.map((x) => {
            return{
                "x": x[0] + '  ' + '( ' + x[1] + ' )',
                "y": x[1]
            };
        });

        this.setState({ finaldataset, isloading: false });
       // console.log(finaldataset);
    }

    render() {
        const {
            localeMessages, faultyProviderConf, finaldataset, totalcount, isloading
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apialertProps = { themeName, finaldataset, totalcount };

        if (!localeMessages || isloading ) {
            return (
                <div style={inProgress}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }
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
                                            defaultMessage='Configuration Erro !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Created widget'}
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
