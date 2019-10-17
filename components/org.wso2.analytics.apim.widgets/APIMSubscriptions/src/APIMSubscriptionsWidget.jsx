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
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMSubscriptions from './APIMSubscriptions';

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
 * Create React Component for APIM Subscriptions
 * @class APIMSubscriptionsWidget
 * @extends {Widget}
 */
class APIMSubscriptionsWidget extends Widget {
    /**
     * Creates an instance of APIMSubscriptionsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMSubscriptionsWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            totalCount: 0,
            weekCount: 0,
            localeMessages: null,
            refreshInterval: 60000, // refresh in 1 min
        };

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

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleWeekQuery = this.assembleWeekQuery.bind(this);
        this.assembleTotalQuery = this.assembleTotalQuery.bind(this);
        this.handleWeekCountReceived = this.handleWeekCountReceived.bind(this);
        this.handleTotalCountReceived = this.handleTotalCountReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID, id } = this.props;
        const { refreshInterval } = this.state;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refresh = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(id);
                    this.assembleTotalQuery();
                };
                setInterval(refresh, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleTotalQuery);
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
     * @memberof APIMSubscriptionsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMSubscriptions/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query
     * @memberof APIMSubscriptionsWidget
     * */
    assembleTotalQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.queryData.queryName = 'totalQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleTotalQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsWidget
     * */
    handleTotalCountReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data && data.length !== 0) {
            this.setState({ totalCount: data.length < 10 ? ('0' + data.length) : data.length });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleWeekQuery();
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMSubscriptionsWidget
     * */
    assembleWeekQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const weekStart = Moment().subtract(7, 'days');
        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.queryData.queryName = 'weekQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{weekStart}}': Moment(weekStart).format('YYYY-MM-DD HH:mm:ss'),
            '{{weekEnd}}': Moment().format('YYYY-MM-DD HH:mm:ss')
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleWeekCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleWeekQuery
     * @param {object} message - data retrieved
     * @memberof APIMSubscriptionsWidget
     * */
    handleWeekCountReceived(message) {
        const { data } = message;

        if (data && data.length !== 0) {
            this.setState({ weekCount: data.length < 10 ? ('0' + data.length) : data.length });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Subscriptions widget
     * @memberof APIMSubscriptionsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConf, totalCount, weekCount,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const subscriptionsProps = { themeName, totalCount, weekCount };

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
                                        + ' Subscriptions widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMSubscriptions {...subscriptionsProps} />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMSubscriptions', APIMSubscriptionsWidget);
