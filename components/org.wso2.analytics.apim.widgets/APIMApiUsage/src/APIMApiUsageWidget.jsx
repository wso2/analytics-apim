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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMApiUsage from './APIMApiUsage';

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
const queryParamKey = 'apiUsage';

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
 * Create React Component for APIM Api Usage widget
 * @class APIMApiUsageWidget
 * @extends {Widget}
 */
class APIMApiUsageWidget extends Widget {
    /**
     * Creates an instance of APIMApiUsageWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiUsageWidget
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
            limit: 5,
            selectedOptions: [],
            usageData: null,
            localeMessages: null,
            inProgress: true,
            dimension: null,
            timeFrom: null,
            timeTo: null,
            perValue: null,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleOnClickAPI = this.handleOnClickAPI.bind(this);
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
        this.loadLimit();

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
     * @param {string} locale Locale name
     * @memberof APIMApiUsageWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiUsage/locales/${locale}.json`)
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
    loadLimit() {
        let { limit } = super.getGlobalState(queryParamKey);
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setQueryParam(limit);
        this.setState({ limit });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMApiUsageWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
            from, to, granularity, dm, op,
        } = receivedMsg;

        if (dm && from) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleMainQuery);
        } else if (dm) {
            this.setState({
                dimension: dm,
                selectedOptions: op,
                inProgress: true,
            }, this.assembleMainQuery);
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                inProgress: !sync,
            }, this.assembleMainQuery);
        }
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMApiUsageWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, dimension, selectedOptions, limit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0 && limit > 0) {
                let filterCondition = '';
                if (selectedOptions[0].name !== 'All') {
                    filterCondition = selectedOptions.map((opt) => {
                        return '(apiName==\'' + opt.name + '\' AND apiVersion==\'' + opt.version + '\')';
                    });
                    filterCondition = 'AND ' + filterCondition.join(' OR ');
                }
                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{from}}': timeFrom,
                    '{{to}}': timeTo,
                    '{{per}}': perValue,
                    '{{limit}}': limit,
                    '{{filterCondition}}': filterCondition,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
            } else {
                this.setState({ inProgress: false, usageData: [] });
            }
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMApiUsageWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const usageData = data.map((dataUnit) => {
                return {
                    api: dataUnit[0] + ' (' + dataUnit[4] + ')',
                    apiversion: dataUnit[1],
                    application: dataUnit[2] + ' (' + dataUnit[5] + ')',
                    usage: dataUnit[3],
                };
            });
            this.setState({ usageData, inProgress: false });
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof APIMApiUsageWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMApiUsageWidget
     * */
    handleLimitChange(event) {
        let limit = (event.target.value).replace('-', '').split('.')[0];
        if (parseInt(limit, 10) < 1) {
            limit = 5;
        }

        this.setQueryParam(parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleMainQuery);
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof APIMApiUsageWidget
     * */
    handleOnClickAPI(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const {
                    tr, sd, ed, g,
                } = super.getGlobalState('dtrp');
                const { api, apiversion, application } = data;
                const apiname = (api.split(' (')[0]).trim();
                const provider = (api.split('(')[1]).split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];
                const queryParams = {
                    dtrp: {
                        tr,
                        sd,
                        ed,
                        g,
                    },
                    dmSelc: {
                        dm: 'api',
                        op: [{ name: apiname, version: apiversion, provider }],
                    },
                    apiUsageTime: {
                        selectedApp: application,
                    },
                };
                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '?widgetStates='
                    + encodeURI(JSON.stringify(queryParams));
            }
        }
    }


    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Usage widget
     * @memberof APIMApiUsageWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, usageData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const apiUsersProps = {
            themeName,
            height,
            limit,
            usageData,
            inProgress,
            username,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM API '
                                            + 'Usage widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMApiUsage
                                {...apiUsersProps}
                                handleLimitChange={this.handleLimitChange}
                                handleOnClickAPI={this.handleOnClickAPI}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiUsage', APIMApiUsageWidget);
