
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
import Widget from '@wso2-dashboards/widget';
import Moment from 'moment';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    addLocaleData, defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';

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
 * Create React Component for APIM Developer Signups
 * @class APIMDeveloperSignups
 * @extends {Widget}
 */
class APIMDeveloperSignups extends Widget {
    /**
     * Creates an instance of APIMDeveloperSignups.
     * @param {any} props @inheritDoc
     * @memberof APIMDeveloperSignups
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            totalCount: 0,
            weekCount: 0,
            localeMessages: null,
        };

        this.styles = {
            headingWrapper: {
                height: '10%',
                margin: 'auto',
                paddingTop: '15px',
                width: '90%',
            },
            cIconWrapper: {
                float: 'left',
                width: '40%',
                height: '62%',
            },
            dataWrapper: {
                float: 'left',
                width: '60%',
                height: '50%',
                paddingTop: '8%',
            },
            weekCount: {
                margin: 0,
                marginTop: '5%',
                color: 'rgb(236, 195, 216)',
                letterSpacing: 1,
                fontSize: '80%',
            },
            typeText: {
                textAlign: 'left',
                fontWeight: 'normal',
                margin: 0,
                display: 'inline',
                marginLeft: '3%',
                letterSpacing: 1.5,
                fontSize: 'small',
            },
            icon: {
                position: 'absolute',
                bottom: '13%',
                right: '8%',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.assembleweekQuery = this.assembleweekQuery.bind(this);
        this.assembletotalQuery = this.assembletotalQuery.bind(this);
        this.handleWeekCountReceived = this.handleWeekCountReceived.bind(this);
        this.handleTotalCountReceived = this.handleTotalCountReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });

        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembletotalQuery);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + this.props.widgetID + "'. " + error);
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
     * @returns {Promise} Promise
     * @memberof APIMDeveloperSignups
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios.get(`${window.contextPath}/public/extensions/widgets/APIMDeveloperSignups/locales/${locale}.json`)
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
     * Formats the siddhi query
     * @memberof APIMDeveloperSignups
     * */
    assembletotalQuery() {
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.totalQuery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleTotalCountReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembletotalQuery
     * @param {object} message - data retrieved
     * @memberof APIMDeveloperSignups
     * */
    handleTotalCountReceived(message) {
        if (message.data.length !== 0) {
            let [[totalCount]] = message.data;
            totalCount = totalCount < 10 ? ('0' + totalCount).slice(-2) : totalCount;
            this.setState({ totalCount });
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleweekQuery();
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMDeveloperSignups
     * */
    assembleweekQuery() {
        const weekStart = Moment().subtract(7, 'days');

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.weekQuery;
            query = query
                .replace('{{weekStart}}', Moment(weekStart).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'));
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleWeekCountReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleweekQuery
     * @param {object} message - data retrieved
     * @memberof APIMDeveloperSignups
     * */
    handleWeekCountReceived(message) {
        if (message.data.length !== 0) {
            let [[weekCount]] = message.data;
            weekCount = weekCount < 10 ? ('0' + weekCount).slice(-2) : weekCount;
            this.setState({ weekCount });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Developer Signups widget
     * @memberof APIMDeveloperSignups
     */
    render() {
        const themeName = this.props.muiTheme.name;
        const {
            localeMessages, faultyProviderConf, totalCount, weekCount,
        } = this.state;

        if (localeMessages) {
            if (faultyProviderConf === true) {
                return (
                    <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                        <div
                            style={{
                                margin: 'auto',
                                width: '50%',
                                marginTop: '20%',
                            }}
                        >
                            <Paper
                                elevation={1}
                                style={{
                                    padding: '5%', border: '2px solid #4555BB',
                                }}
                            >
                                <Typography variant='h5' component='h3'>
                                    <FormattedMessage id='config.error.heading' defaultMessage='Configuration Error !' />
                                </Typography>
                                <Typography component='p'>
                                    <FormattedMessage
                                        id='config.error.body'
                                        defaultMessage='Cannot fetch provider configuration for APIM Developer Signups widget'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    </IntlProvider>
                );
            } else {
                return (
                    <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                        <div style={{
                            width: '90%',
                            height: '85%',
                            margin: '5% 5%',
                            background: themeName === 'dark' ? 'linear-gradient(to right, rgba(7, 4, 51, 1) 0%, rgb(188, 39, 142) 46%, rgb(101, 42, 80) 100%)' : '#fff',
                            fontFamily: "'Open Sans', sans-serif",
                        }}
                        >
                            <div style={this.styles.headingWrapper}>
                                <h3 style={{
                                    borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #e01171',
                                    paddingBottom: '10px',
                                    margin: 'auto',
                                    marginTop: 0,
                                    textAlign: 'left',
                                    fontWeight: 'normal',
                                    letterSpacing: 1.5,
                                }}
                                >
                                    <FormattedMessage id='widget.heading' defaultMessage='TOTAL SIGNUPS' />
                                </h3>
                            </div>
                            <div style={this.styles.cIconWrapper}>
                                <SupervisorAccount style={{
                                    display: 'block',
                                    margin: 'auto',
                                    marginTop: '25%',
                                    width: '50%',
                                    height: '50%',
                                    color: themeName === 'dark' ? '#fff' : '#e01171',
                                }}
                                />
                            </div>
                            <div style={this.styles.dataWrapper}>
                                <h1
                                    style={{
                                        margin: 'auto',
                                        textAlign: 'center',
                                        fontSize: '300%',
                                        display: 'inline',
                                        color: themeName === 'dark' ? '#fff' : '#e01171',
                                    }}
                                >
                                    {totalCount}
                                </h1>
                                <h3 style={this.styles.typeText}>{totalCount === '01' ? 'SIGNUP' : 'SIGNUPS'}</h3>
                                <p style={this.styles.weekCount}>
                                    [
                                    {' '}
                                    {weekCount}
                                    {' '}
                                    {weekCount === '01' ? 'SIGNUP' : 'SIGNUPS'}
                                    {' '}
                                    <FormattedMessage id='within.week.text' defaultMessage='WITHIN LAST WEEK ' />
                                    ]
                                </p>
                            </div>
                            <button
                                type='submit'
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '21%',
                                    background: themeName === 'dark' ? 'linear-gradient(to right, rgba(37, 38, 41, 0.75) 0%, rgba(252, 252, 252, 0) 100%)' : '#fff',
                                    border: 'none',
                                    borderTop: themeName === 'dark' ? 'none' : '1.5px solid #000',
                                    color: themeName === 'dark' ? '#fff' : '#000',
                                    textAlign: 'left',
                                    padding: '0 5%',
                                    fontSize: '90%',
                                    letterSpacing: 1,
                                }}
                                onClick={() => {
                                    window.location.href = '/portal/dashboards/apimanalytics/Signups-Analysis';
                                }}
                            >
                                <FormattedMessage id='overtime.btn.text' defaultMessage='Overtime Analysis' />
                                <PlayCircleFilled style={this.styles.icon} />
                            </button>
                        </div>
                    </IntlProvider>
                );
            }
        } else {
            return (
                <div>
                    <CircularProgress style={this.styles.loadingIcon} />
                </div>
            );
        }
    }
}

global.dashboard.registerWidget('APIMDeveloperSignups', APIMDeveloperSignups);
