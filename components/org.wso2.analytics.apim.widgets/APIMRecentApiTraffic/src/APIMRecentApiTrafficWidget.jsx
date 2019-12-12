/* eslint-disable require-jsdoc */
/* eslint-disable no-console */
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
import APIMRecentApiTraffic from './APIMRecentApiTraffic';

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

// Create react component for the APIM Recent Api Traffic
class APIMRecentApiTrafficWidget extends Widget {
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
            usageData: null,
            localeMessages: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleChange = this.handleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }


    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMRecentApiTraffic/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    // Set the date time range
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiUsageQuery);
    }


    // Format the siddhi query
    assembleApiUsageQuery() {
        // const queryParam = super.getGlobalState(queryParamKey);
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apiusagequery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiUsageReceived, dataProviderConfigs);
    }


    // format the query data
    handleApiUsageReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = [];
            const counter = 0;

            data.forEach((dataUnit) => {
                usageData.push({
                    id: counter, apiname: dataUnit[0], version: dataUnit[1], hits: dataUnit[3],
                });
            });
            this.setState({ usageData });
        }
    }


    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMRecentApiTrafficWidget
     * */
    handleChange(event) {
        const { id } = this.props;

        this.setQueryParam(event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiUsageQuery();
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMRecentApiTrafficWidget
     * */
    apiCreatedHandleChange(event) {
        // const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiUsageQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Recent Api Traffic widget
     * @memberof APIMRecentApiTrafficWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, usageData,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName, height, usageData,
        };

        if (!localeMessages || !usageData) {
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
                                            defaultMessage={'Cannot fetch provider configuration forAPIM Api '
                                            + 'Recent Api Traffic widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMRecentApiTraffic
                                {...apiUsageProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                handleChange={this.handleChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMRecentApiTraffic', APIMRecentApiTrafficWidget);
