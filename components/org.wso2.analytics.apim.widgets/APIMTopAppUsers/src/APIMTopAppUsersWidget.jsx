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

import APIMTopAppUsers from './APIMTopAppUsers';

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
const queryParamKey = 'topAppUsers';

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
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @return {number}
 * */
function sortFunction(a, b) {
    const nameA = a.appName.toLowerCase();
    const nameB = b.appName.toLowerCase();

    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

/**
 * Widget for Top Application Users stats
 * @class APIMTopAppUsersWidget
 * @extends {Widget}
 */
class APIMTopAppUsersWidget extends Widget {
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
            loading: {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            limit: 5,
            applicationList: [],
            applicationSelected: null,
            usageData: [],
            legendData: [],
            localeMessages: null,
            inProgress: false,
            refreshAppListInterval: 1600000,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.applicationSelectedHandleChange = this.applicationSelectedHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleAppQuery = this.assembleAppQuery.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID, id } = this.props;
        const { refreshAppListInterval } = this.state;
        const locale = languageWithoutRegionCode || language;

        this.loadLocale(locale);
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve the application list
                const refreshApplicationList = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(id);
                    this.assembleAppQuery();
                };
                setInterval(refreshApplicationList, refreshAppListInterval);
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
     * @memberof APIMTopAppUsersWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopAppUsers/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMTopAppUsersWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: true,
        }, this.assembleAppQuery);
    }

    /**
     * Retrieve applications of subscriber
     * @memberof APIMTopAppUsersWidget
     * */
    assembleAppQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let { username } = super.getCurrentUser();

        // if email username is enabled, then super tenants will be saved with '@carbon.super' suffix, else, they
        // are saved without tenant suffix
        if (username.split('@').length === 2) {
            username = username.replace('@carbon.super', '');
        }

        dataProviderConfigs.configs.config.queryData.queryName = 'applicationQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{appOwner}}': username
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleAppDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleAppQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopAppUsersWidget
     * */
    handleAppDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const queryParam = super.getGlobalState(queryParamKey);
            let { applicationSelected, limit } = queryParam;
            if (!limit) {
                limit = 5;
            }
            const applicationList = data.map((dataUnit) => {
                return {
                    appId: dataUnit[0],
                    appName: dataUnit[1],
                };
            });
            applicationList.sort(sortFunction);

            if (!applicationSelected || !data.some(application => application.appId === applicationSelected)) {
                if (applicationList.length > 0) {
                    applicationSelected = applicationList[0].appId;
                }
            }
            this.setQueryParam(applicationSelected, limit);
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ applicationList, applicationSelected, limit }, this.assembleMainQuery);
        }
    }

    /**
     * Formats the siddhi query - appUsageQuery
     * @memberof APIMTopAppUsersWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { applicationSelected, limit } = queryParam;

        if (applicationSelected && limit) {
            const { id, widgetID: widgetName } = this.props;
            const dataProviderConfigs = cloneDeep(providerConfig);

            dataProviderConfigs.configs.config.queryData.queryName = 'appUsageQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{applicationId}}': applicationSelected,
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopAppUsersWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = data.map((dataUnit) => {
                return {
                    username: dataUnit[0],
                    hits: dataUnit[1],
                };
            });
            const legendData = usageData.map((dataUnit) => {
                return { name: dataUnit.username };
            });
            this.setState({ usageData, legendData, inProgress: false });
        }
    }

    /**
     * Updates query param values
     * @param {string} applicationSelected - API Name menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMTopAppUsersWidget
     * */
    setQueryParam(applicationSelected, limit) {
        super.setGlobalState(queryParamKey, {
            applicationSelected,
            limit,
        });
    }

    /**
     * Handle onChange of limit
     * @param {Event} event - listened event
     * @memberof APIMTopAppUsersWidget
     * */
    handleLimitChange(event) {
        const { id } = this.props;
        const { applicationSelected } = this.state;
        // disallow negative and decimal values
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(applicationSelected, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle onChange selected application
     * @param {Event} event - listened event
     * @memberof APIMTopAppUsersWidget
     * */
    applicationSelectedHandleChange(event) {
        this.setState({ inProgress: true });
        let { limit } = this.state;
        const { id } = this.props;

        if (!limit) {
            limit = 5;
        }

        this.setQueryParam(event.target.value, limit);
        this.setState({ applicationSelected: event.target.value, limit });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top Application Users widget
     * @memberof APIMTopAppUsersWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, limit, applicationSelected, usageData, legendData,
            applicationList, inProgress,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const appUsersProps = {
            themeName,
            height,
            width,
            limit,
            applicationList,
            applicationSelected,
            usageData,
            legendData,
            inProgress,
        };

        if (!localeMessages || !usageData) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM'
                                            + ' Top Application Users widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMTopAppUsers
                                {...appUsersProps}
                                applicationSelectedHandleChange={this.applicationSelectedHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopAppUsers', APIMTopAppUsersWidget);
