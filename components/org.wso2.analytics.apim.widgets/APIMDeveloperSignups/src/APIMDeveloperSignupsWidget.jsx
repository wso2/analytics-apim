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
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import cloneDeep from 'lodash/cloneDeep';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import APIMDeveloperSignups from './APIMDeveloperSignups';

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
 * @class APIMDeveloperSignupsWidget
 * @extends {Widget}
 */
class APIMDeveloperSignupsWidget extends Widget {
    /**
     * Creates an instance of APIMDeveloperSignupsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMDeveloperSignupsWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            totalCount: 0,
            weekCount: 0,
            localeMessages: null,
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
        };

        this.assembleweekQuery = this.assembleweekQuery.bind(this);
        this.assembletotalQuery = this.assembletotalQuery.bind(this);
        this.handleWeekCountReceived = this.handleWeekCountReceived.bind(this);
        this.handleTotalCountReceived = this.handleTotalCountReceived.bind(this);
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
                }, this.assembletotalQuery);
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
     * @memberof APIMDeveloperSignupsWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMDeveloperSignups/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query
     * @memberof APIMDeveloperSignupsWidget
     * */
    assembletotalQuery() {
        const { providerConfig } = this.state;
        const { id } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.totalQuery;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleTotalCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembletotalQuery
     * @param {object} message - data retrieved
     * @memberof APIMDeveloperSignupsWidget
     * */
    handleTotalCountReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            let [[totalCount]] = data;
            totalCount = totalCount < 10 ? ('0' + totalCount).slice(-2) : totalCount;
            this.setState({ totalCount });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleweekQuery();
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APIMDeveloperSignupsWidget
     * */
    assembleweekQuery() {
        const { providerConfig } = this.state;
        const { id } = this.props;
        const weekStart = Moment().subtract(7, 'days');

        const dataProviderConfigs = cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.weekQuery;
        query = query
            .replace('{{weekStart}}', Moment(weekStart).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'));
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(id, this.handleWeekCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleweekQuery
     * @param {object} message - data retrieved
     * @memberof APIMDeveloperSignupsWidget
     * */
    handleWeekCountReceived(message) {
        const { data } = message;

        if (data.length !== 0) {
            let [[weekCount]] = data;
            weekCount = weekCount < 10 ? ('0' + weekCount).slice(-2) : weekCount;
            this.setState({ weekCount });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Developer Signups widget
     * @memberof APIMDeveloperSignupsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConf, totalCount, weekCount,
        } = this.state;
        const { loadingIcon, paper, paperWrapper } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const signupsProps = { themeName, totalCount, weekCount };

        if (!localeMessages) {
            return (<CircularProgress style={loadingIcon} />);
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                {
                    faultyProviderConf ? (
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
                                        defaultMessage='Cannot fetch provider configuration for APIM
                                         Developer Signups widget'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    ) : (
                        <APIMDeveloperSignups {...signupsProps} />
                    )
                }
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMDeveloperSignups', APIMDeveloperSignupsWidget);
