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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import APIMOverallApiInfo from './APIMOverallApiInfo';

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
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apiInfoSummary';

let refreshIntervalId = null;

/**
 * Create react component for the APIM Oerall Api Info widget
 * @class APIMOverallApiInfoWidget
 * @extends {Widget}
 */
class APIMOverallApiInfoWidget extends Widget {
    /**
     * Creates an instance of APIMOverallApiInfoWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallApiInfoWidget
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
            button: {
                maxWidth: '30px',
                maxHeight: '30px',
                minWidth: '30px',
                minHeight: '30px',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            usageData: null,
            refreshInterval: 60000, // 1min
            refreshIntervalId: null,
            localeMessages: null,
            inProgress: true,
            limit: 5,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleApiInfo = this.assembleApiInfo.bind(this);
        this.handleApiInfoReceived = this.handleApiInfoReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
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
        const { refreshInterval } = this.state;
        this.loadLimit();

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refresh = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(widgetID);
                    this.setState({
                        providerConfig: message.data.configs.providerConfig,
                    }, this.assembleApiInfo);
                };
                refreshIntervalId = setInterval(refresh, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleApiInfo);
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
        clearInterval(refreshIntervalId);
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMOverallApiInfoWidget
      * @returns {string}
      */
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

    /**
     * Retrieve the limit from query param
     * @memberof APIMOverallApiInfoWidget
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
     * Updates query param values
     * @param {number} limit - data limitation value
     * @memberof APIMOverallApiInfoWidget
     * */
    setQueryParam(limit) {
        super.setGlobalState(queryParamKey, { limit });
    }

    /**
     * Retreive the API info for sub rows
     * @memberof APIMOverallApiInfoWidget
     * */
    assembleApiInfo() {
        const { providerConfig, limit } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (limit > 0) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'infoquery';

            const timeTo = new Date().getTime();
            const timeFrom = Moment(timeTo).subtract(1, 'days').toDate().getTime();

            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': 'day',
                '{{limit}}': limit,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiInfoReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleApiSubInfo query
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiInfoWidget
     * */
    handleApiInfoReceived(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });
        const { id } = this.props;
        this.setState({ apiInfoData: newData, inProgress: false });
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Handle limit Change
     * @param {Event} event - listened event
     * @memberof APIMOverallApiInfoWidget
     * */
    handleLimitChange(event) {
        let limit = (event.target.value).replace('-', '').split('.')[0];
        this.setQueryParam(parseInt(limit, 10));
        if (limit < 1) {
            limit = 5;
        }

        if (limit) {
            this.setState({ inProgress: true, limit }, this.assembleApiInfo);
        } else {
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ limit, inProgress: false, usageData: [] });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Overall Api Info widget
     * @memberof APIMOverallApiInfoWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiInfoData, inProgress, limit,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();
        const apiUsageProps = {
            themeName, height, apiInfoData, inProgress, username, limit,
        };

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography
                                        variant='h5'
                                        component='h3'
                                    >
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM Overall '
                                            + 'Api Info Widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMOverallApiInfo
                                {...apiUsageProps}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiInfo', APIMOverallApiInfoWidget);
