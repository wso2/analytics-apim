/* eslint-disable no-console */
/* eslint-disable valid-jsdoc */
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


const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];


class APIMApiErrorRateWidget extends Widget {
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
            errorCount: null,
            totalReqCount: null,
            localeMessages: null,
            sorteddata: null,
            errorpercentage: null,
            isloading: true,
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
        this.handleTotalReqCountReceived = this.handleTotalReqCountReceived.bind(this);
        this.handleTotalErrorCountReceived = this.handleTotalErrorCountReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.analyzeerrorrate = this.analyzeerrorrate.bind(this);
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

    // Set the date time range
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            isloading: true,
            errorCount: null,
            totalReqCount: null,
            sorteddata: null,
            errorpercentage: null,
        }, this.assembleTotalErrorCountQuery);
    }


    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     * @memberof APIMApiErrorRateWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMApiErrorRate/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    // format the siddhi query to get total errors
    assembleTotalErrorCountQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, isloading,
        } = this.state;
        console.log(isloading);
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalerrorcountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        this.setState({ isloading: true });
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalErrorCountReceived, dataProviderConfigs);
    }

    // format the total error count received
    handleTotalErrorCountReceived(message) {
        const { data } = message;
        const { id } = this.props;
        this.setState({ errorCount: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleTotalRequestCount();
    }

    // Formats the siddhi query using selected options
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
            .subscribeWidget(id, widgetName, this.handleTotalReqCountReceived, dataProviderConfigs);
    }

    // Formats data received from assembleTotalRequestCount
    handleTotalReqCountReceived(message) {
        const { data } = message;
        const { id } = this.props;
        this.setState({ totalReqCount: data });

        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzeerrorrate();
    }

    // analyze the errors received
    analyzeerrorrate() {
        const { errorCount, totalReqCount } = this.state;
        const sorteddata = [];
        let totalhits = 0;
        let totalerrors = 0;
        let errorpercentage = 0;

        // console.log(errorpercentage);

        totalReqCount.forEach((element) => {
            totalhits += element[1];
        });

        errorCount.forEach((element) => {
            totalerrors += element[1];
        });

        errorpercentage = ((totalerrors / totalhits) * 100).toPrecision(3);

        totalReqCount.forEach((dataUnit) => {
            for (let err = 0; err < errorCount.length; err++) {
                if (dataUnit[0] === errorCount[err][0]) {
                    const percentage = (errorCount[err][1] / dataUnit[1]) * 100;
                    sorteddata.push({
                        x: errorCount[err][0] + ' ' + percentage.toPrecision(3) + '%', y: percentage,
                    });
                }
            }
        });

        this.setState({ sorteddata, errorpercentage, isloading: false });
    }

    render() {
        const {
            localeMessages, faultyProviderConf, errorCount, totalReqCount, sorteddata, errorpercentage, isloading,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apitestProps = {
            themeName, errorCount, totalReqCount, sorteddata, errorpercentage,
        };
        if (!localeMessages || isloading) {
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
                            <APIMApiErrorRate {...apitestProps} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiErrorRate', APIMApiErrorRateWidget);
