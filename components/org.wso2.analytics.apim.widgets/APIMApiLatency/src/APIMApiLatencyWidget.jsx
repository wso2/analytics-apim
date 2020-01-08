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
import APIMApiLatency from './APIMApiLatency';

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

const queryParamKey = 'apilatency';


const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];


class APIMApiLatencyWidget extends Widget {

    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            latancyData: null,
           // refreshInterval: 60000, // 1min
        };

        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '10px solid #4555BB',
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

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }


        this.assemblelatencyQuery = this.assemblelatencyQuery.bind(this);
        this.handleTotallatencyReceived = this.handleTotallatencyReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
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

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    //Load the locale file
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiLatency/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

     //Set the date time range
     handlePublisherParameters(receivedMsg) {
         //console.log(receivedMsg);
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assemblelatencyQuery);
    }

    //format the siddhi query
    assemblelatencyQuery() {
        const { id, widgetID: widgetName } = this.props;
        const {timeFrom, timeTo, perValue, providerConfig} = this.state;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'latencyquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotallatencyReceived, dataProviderConfigs);
    }

    //Format the data received from the query
    handleTotallatencyReceived(message) {
        const { data } = message;
         //console.log(data);
        const latancyData = [];
        
        if (data) {
            data.forEach(dataunit => {
                latancyData.push({
                    ApiName: dataunit[0]+'('+dataunit[3]+')', AvgLatency: (dataunit[1]/dataunit[2])})
                
            });
        }

        this.setState({latancyData});
    }

    //Render the Apim Latency Widget
    render() {
        const {
            localeMessages, faultyProviderConf, latancyData, height
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiLatancyProps = { themeName, latancyData, height };


        if (!localeMessages) {
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
                                            defaultMessage='Configuration Error !'
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
                            <APIMApiLatency {...apiLatancyProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiLatency', APIMApiLatencyWidget);
