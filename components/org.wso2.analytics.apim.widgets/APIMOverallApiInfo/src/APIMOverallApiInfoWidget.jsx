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
import APIMOverallApiInfo from './APIMOverallApiInfo';
import Button from '@material-ui/core/Button';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';





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


const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

// Create react component for the APIM Recent Api Details
class APIMOverallApiInfoWidget extends Widget {
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
            usageData: null,
            totalcount: null,
            localeMessages: null,
            isloading: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.AssembleMainApiInfoQuery = this.AssembleMainApiInfoQuery.bind(this);
        this.handleMainApiInfo = this.handleMainApiInfo.bind(this);
        this.assembleApiSubInfo = this.assembleApiSubInfo.bind(this);
        this.handleApiSubInfoReceived = this.handleApiSubInfoReceived.bind(this);
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


    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiInfo/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    // Set the date time range
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.AssembleMainApiInfoQuery);
    }


    // Format the siddhi query
    assembleApiSubInfo() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'subapiinfoquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiSubInfoReceived, dataProviderConfigs);
    }


    // format the query data
    handleApiSubInfoReceived(message) {
        const { data } = message;
        var err5xx = null;
        let err4xx = null;
        const { id } = this.props;
        if (data) {
            const usageData = [];
            data.forEach((element) => {
                const avglatency = element[5] / element[3];
                if (element[4] > 399 && element[4] < 499) {
                    usageData.push([element[0], element[1], element[2], element[3], 0, element[3], parseInt(avglatency), element[6]]);
                    err4xx += element[4];
                } else if (element[4] > 499) {
                    usageData.push([element[0],element[1], element[2], element[3], element[3], 0, parseInt(avglatency), element[6]]);
                    err5xx += element[4];
                } else {
                    usageData.push([element[0],element[1], element[2], element[3], 0, 0, parseInt(avglatency), element[6]]);
                }
            });
            this.setState({ usageData, isloading:false });
            super.getWidgetChannelManager().unsubscribeWidget(id);
        }
    }


    // Query to calculate the main api count
    AssembleMainApiInfoQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'mainapiinfoquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleMainApiInfo, dataProviderConfigs);
    }

    // handle the total count received
    handleMainApiInfo(message) {
        const totalcount = [];
        const { data } = message;
        const { id } = this.props;
        data.forEach((element) => {
            totalcount.push([element[0], element[1], 'All', 'All', element[2], '..', '..',parseInt(element[3]/element[2]),<Button style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="contained" color="primary" onClick={() => {
                window.location.href = './single-api-stats#{"apidata":{"apiName":"'+element[0]+'","apiVersion":"'+element[1]+'","sync":false}}';
                }}>
            <VisibilityOutlinedIcon/>
          </Button>]);
        });

        this.setState({ totalcount });

        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiSubInfo();
    }


   // Render the APIM Recent Api Traffic widget 
    render() {
        const {
            localeMessages, faultyProviderConfig, height, usageData, totalcount, isloading,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName, height, usageData, totalcount, isloading,
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
                                            defaultMessage={'Cannot fetch provider configuration forAPIM Overall '
                                            + 'Api Info Widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMOverallApiInfo
                                {...apiUsageProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiInfo', APIMOverallApiInfoWidget);