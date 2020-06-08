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
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refresh = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(widgetID);
                    this.assembleApiInfo(message.data.configs.providerConfig);
                };
                refreshIntervalId = setInterval(refresh, refreshInterval);
                this.assembleApiInfo(message.data.configs.providerConfig);
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
     * Retreive the API info for sub rows
     * @memberof APIMOverallApiInfoWidget
     * */
    assembleApiInfo(dataProviderConfigs) {
        const { id, widgetID: widgetName } = this.props;
        dataProviderConfigs.configs.config.queryData.queryName = 'infoquery';

        let timeTo = new Date().getTime();
        let timeFrom = Moment(timeTo).subtract(7, 'days').toDate().getTime();

        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': 'day',
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiInfoReceived, dataProviderConfigs);
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
        console.log('newData', newData);
        const { id } = this.props;
        this.setState({ apiInfoData: newData, inProgress: false });
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Overall Api Info widget
     * @memberof APIMOverallApiInfoWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiInfoData, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName, height, apiInfoData, inProgress,
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
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallApiInfo', APIMOverallApiInfoWidget);
