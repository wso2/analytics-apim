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
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';

import APIMRegisteredAppUsers from './APIMRegisteredAppUsers';

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
 * Compare two values and return sorting order
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
 * Display registered users of applications
 * @class APIMRegisteredAppUsersWidget
 * @extends {Widget}
 */
class APIMRegisteredAppUsersWidget extends Widget {
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
            faultyProviderConfig: false,
            applicationList: [],
            appKeyMapList: [],
            consumerKeyMapList: [],
            appAccessList: [],
            usageData: [],
            legendData: [],
            localeMessages: null,
            inProgress: true,
            refreshAppListInterval: 60000, // 10 mins
            refreshIntervalId: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleAppCountQuery = this.assembleAppCountQuery.bind(this);
        this.handleAppCountDataReceived = this.handleAppCountDataReceived.bind(this);
        this.assembleAppQuery = this.assembleAppQuery.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.assembleAppKeyMapQuery = this.assembleAppKeyMapQuery.bind(this);
        this.handleAppKeyDataReceived = this.handleAppKeyDataReceived.bind(this);
        this.assembleConsumerAppsQuery = this.assembleConsumerAppsQuery.bind(this);
        this.handleConsumerAppsDataReceived = this.handleConsumerAppsDataReceived.bind(this);
        this.assembleAppAccessQuery = this.assembleAppAccessQuery.bind(this);
        this.handleAppAccessDataReceived = this.handleAppAccessDataReceived.bind(this);
        this.deriveAppUserData = this.deriveAppUserData.bind(this);
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
        const { widgetID, id } = this.props;
        const { refreshAppListInterval } = this.state;

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve the application list
                const refreshApplicationList = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(id);
                    this.assembleAppCountQuery();
                };
                const refreshIntervalId = setInterval(refreshApplicationList, refreshAppListInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                    inProgress: true,
                    refreshIntervalId,
                }, this.assembleAppCountQuery);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. Error: " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        const { refreshIntervalId } = this.state;
        clearInterval(refreshIntervalId);
        this.setState({
            refreshIntervalId: null,
        });
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     *
     * @param {string} locale Locale name
     * @memberof APIMRegisteredAppUsersWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMRegisteredAppUsers/locales/${locale}.json`)
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
     * Retrieve the application count to verify whether stats are available
     * @memberof APIMRegisteredAppUsersWidget
     * */
    assembleAppCountQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.queryData.queryName = 'appCountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{appOwner}}': '{{formattedUsername}}',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleAppCountDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleAppCountQuery
     * @param {object} message - data retrieved
     * @memberof APIMRegisteredAppUsersWidget
     * */
    handleAppCountDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data && data.length > 0) {
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleAppQuery();
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve list of application name and Id
     * @memberof APIMRegisteredAppUsersWidget
     * */
    assembleAppQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.queryData.queryName = 'applicationQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{appOwner}}': '{{formattedUsername}}',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleAppDataReceived, dataProviderConfigs);
    }

    /**
     * Formats data retrieved from assembleAppQuery
     * @param {object} message - data retrieved
     * @memberof APIMRegisteredAppUsersWidget
     * */
    handleAppDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const applicationList = data.map((dataUnit) => {
                return {
                    appId: dataUnit[0],
                    appName: dataUnit[1],
                };
            });
            applicationList.sort(sortFunction);

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ applicationList }, this.assembleAppKeyMapQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve application id to consumer key mapping, to get the consumer key of the application
     * @memberof APIMRegisteredAppUsersWidget
     * */
    assembleAppKeyMapQuery() {
        const { providerConfig, applicationList } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        if (applicationList && applicationList.length > 0) {
            const appIdList = applicationList.map((app) => { return app.appId; });
            const appIdListQuery = 'APPLICATION_ID==' + appIdList.join(' or APPLICATION_ID==');
            dataProviderConfigs.configs.config.queryData.queryName = 'appKeyMapQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{query}}': appIdListQuery,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAppKeyDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleAppKeyMapQuery
     * @param {object} message - data retrieved
     * @memberof APIMRegisteredAppUsersWidget
     * */
    handleAppKeyDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const appKeyMapList = data.map((dataUnit) => {
                return {
                    appId: dataUnit[0],
                    consumerKey: dataUnit[1],
                };
            });

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ appKeyMapList }, this.assembleConsumerAppsQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve consumer key to consumer key id mapping, to get the consumer key id of the application
     * @memberof APIMRegisteredAppUsersWidget
     * */
    assembleConsumerAppsQuery() {
        const { providerConfig, appKeyMapList } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        if (appKeyMapList && appKeyMapList.length > 0) {
            const appKeyList = appKeyMapList.map((app) => { return app.consumerKey; });
            const appKeyListQuery = 'CONSUMER_KEY==\'' + appKeyList.join('\' or CONSUMER_KEY==\'') + '\'';
            dataProviderConfigs.configs.config.queryData.queryName = 'consumerAppsQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{query}}': appKeyListQuery,
            };
            super.getWidgetChannelManager().subscribeWidget(id, widgetName,
                this.handleConsumerAppsDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleConsumerAppsQuery
     * @param {object} message - data retrieved
     * @memberof APIMRegisteredAppUsersWidget
     * */
    handleConsumerAppsDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const consumerKeyMapList = data.map((dataUnit) => {
                return {
                    consumerKey: dataUnit[0],
                    consumerKeyId: dataUnit[1],
                };
            });

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ consumerKeyMapList }, this.assembleAppAccessQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve username to consumer key id mapping, to get the users of the application
     * @memberof APIMRegisteredAppUsersWidget
     * */
    assembleAppAccessQuery() {
        const { providerConfig, consumerKeyMapList } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        if (consumerKeyMapList && consumerKeyMapList.length > 0) {
            const consumerKeyList = consumerKeyMapList.map((app) => { return app.consumerKeyId; });
            const consumerKeyListQuery = 'CONSUMER_KEY_ID=='
                + consumerKeyList.join(' or CONSUMER_KEY_ID==');
            dataProviderConfigs.configs.config.queryData.queryName = 'accessTokenQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{query}}': consumerKeyListQuery,
            };
            super.getWidgetChannelManager().subscribeWidget(id, widgetName,
                this.handleAppAccessDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleAppAccessQuery
     * @param {object} message - data retrieved
     * @memberof APIMRegisteredAppUsersWidget
     * */
    handleAppAccessDataReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data) {
            const appAccessList = data.map((dataUnit) => {
                return {
                    consumerKeyId: dataUnit[0],
                    user: dataUnit[1],
                };
            });

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ appAccessList }, this.deriveAppUserData);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Derive the registered application user details
     * @memberof APIMRegisteredAppUsersWidget
     * */
    deriveAppUserData() {
        const {
            applicationList, appKeyMapList, consumerKeyMapList, appAccessList,
        } = this.state;

        const usageData = [];
        const legendData = [];

        if (applicationList) {
            applicationList.map((app) => {
                const consumerKeysList = appKeyMapList.filter((appKey) => { return appKey.appId === app.appId; });
                if (consumerKeysList.length > 0) {
                    const consumerKeys = consumerKeysList.map((key) => { return key.consumerKey; });
                    const consumerKeyIdList = consumerKeyMapList
                        .filter((appKey) => { return consumerKeys.includes(appKey.consumerKey); });
                    const consumerKeyIds = consumerKeyIdList.map((keyId) => { return keyId.consumerKeyId; });
                    const appUsers = appAccessList
                        .filter((users) => { return consumerKeyIds.includes(users.consumerKeyId); });
                    const usernames = appUsers.map((user) => { return user.user; });
                    const distinctappUsers = [...new Set(usernames)];

                    usageData.push({ applicationName: [app.appName], users: distinctappUsers.length });
                    legendData.push({ name: app.appName });
                }
                return null;
            });
        }
        this.setState({ usageData, legendData, inProgress: false });
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Registered App Users widget
     * @memberof APIMRegisteredAppUsersWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, width, usageData, inProgress, legendData,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const registeredUsersProps = {
            themeName,
            height,
            width,
            usageData,
            legendData,
            inProgress,
            username,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
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
                                            + ' Registered Application Users widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMRegisteredAppUsers {...registeredUsersProps} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMRegisteredAppUsers', APIMRegisteredAppUsersWidget);
