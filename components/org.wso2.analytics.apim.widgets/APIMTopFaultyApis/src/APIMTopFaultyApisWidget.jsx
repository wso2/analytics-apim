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
import APIMTopFaultyApis from './APIMTopFaultyApis';

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
const queryParamKey = 'faultyapis';

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
 * Create React Component for APIM Top Faulty Apis
 * @class APIMTopFaultyApisWidget
 * @extends {Widget}
 */
class APIMTopFaultyApisWidget extends Widget {
    /**
     * Creates an instance of APIMTopFaultyApisWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopFaultyApisWidget
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
            faultData: null,
            legendData: null,
            limit: 5,
            localeMessages: null,
            inProgress: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMTopFaultyApisWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMTopFaultyApis/locales/${locale}.json`)
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
     * @memberof APIMTopFaultyApisWidget
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
     * @memberof APIMTopFaultyApisWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.assembleQuery);
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMTopFaultyApisWidget
     * */
    assembleQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, limit,
        } = this.state;
        const { widgetID: widgetName } = this.props;

        if (limit > 0) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'query';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(this.props.id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, faultData: [] });
        }
    }

    /**
     * Formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * @memberof APIMTopFaultyApisWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        if (data && data.length > 0) {
            const faultData = [];
            const legendData = [];
            let counter = 0;
            let apiName = '';
            data.forEach((dataUnit) => {
                counter += 1;
                apiName = dataUnit[0] + ' (' + dataUnit[2] + ')';
                if (!legendData.includes({ name: apiName })) {
                    legendData.push({ name: apiName });
                }
                faultData.push({
                    id: counter, apiname: apiName, apiversion: dataUnit[1], faultcount: dataUnit[4],
                });
            });

            this.setState({ legendData, faultData, inProgress: false });
        } else {
            this.setState({ inProgress: false, faultData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof APIMTopFaultyApisWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Handle Select Change
     * @param {Event} event - listened event
     * @memberof APIMTopFaultyApisWidget
     * */
    handleChange(event) {
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleQuery);
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle onClick of an API and drill down
     * @memberof APIMTopFaultyApisWidget
     * */
    handleOnClickAPI(data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown) {
                const {
                    tr, sd, ed, g, sync,
                } = super.getGlobalState('dtrp');
                const { apiname, apiversion } = data;
                const api = (apiname.split(' (')[0]).trim();
                const provider = (apiname.split('(')[1]).split(')')[0].trim();
                const locationParts = window.location.pathname.split('/');
                const dashboard = locationParts[locationParts.length - 2];

                window.location.href = window.contextPath
                    + '/dashboards/' + dashboard + '/' + drillDown + '#{"dtrp":{"tr":"' + tr + '","sd":"' + sd
                    + '","ed":"' + ed + '","g":"' + g + '","sync":' + sync + '},"dmSelc":{"dm":"api","op":[{"name":"'
                    + api + '","version":"' + apiversion + '","provider":"' + provider + '"}]}}';
            }
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top Faulty Apis widget
     * @memberof APIMTopFaultyApisWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, faultData, legendData, inProgress, width,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const faultyApisProps = {
            themeName, height, limit, faultData, legendData, inProgress, width,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                {
                    faultyProviderConfig ? (
                        <MuiThemeProvider
                            theme={themeName === 'dark' ? darkTheme : lightTheme}
                        >
                            <div
                                style={paperWrapper}
                            >
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Top Faulty Apis widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        </MuiThemeProvider>
                    ) : (
                        <APIMTopFaultyApis
                            {...faultyApisProps}
                            handleChange={this.handleChange}
                            handleOnClickAPI={this.handleOnClickAPI}
                        />
                    )
                }
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopFaultyApis', APIMTopFaultyApisWidget);
