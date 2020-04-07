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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    FormattedMessage,
} from 'react-intl';
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import withWrappedWidget from '@analytics-apim/common-lib/src/WrappedWidget';
import APIMApiUsageSummary from './APIMApiUsageSummary';

const LAST_WEEK = 'last-week';
const THIS_WEEK = 'this-week';

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

let refreshIntervalId = null;
const refreshInterval = 60000; // 1min

/**
 * Create React Component for APIM Api Created
 * @class APIMApiUsageSummaryWidget
 * @extends {Widget}
 */
class APIMApiUsageSummaryWidget extends Component {
    /**
     * Creates an instance of APIMApiUsageSummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiUsageSummaryWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            lastWeekCount: 0,
            thisWeekCount: 0,
            inProgress: false,
        };

        const { height } = props;
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height,
            },
        };

        this.assembleUsageCountQuery = this.assembleUsageCountQuery.bind(this);
        this.handleUsageCountReceived = this.handleUsageCountReceived.bind(this);
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentDidUpdate(prevProps) {
        const {
            id, getWidgetChannelManager, widgetConf,
        } = this.props;

        if (JSON.stringify(widgetConf) !== JSON.stringify(prevProps.widgetConf)) {
            const refresh = () => {
                getWidgetChannelManager().unsubscribeWidget(id + LAST_WEEK);
                getWidgetChannelManager().unsubscribeWidget(id + THIS_WEEK);
                this.assembleUsageCountQuery(THIS_WEEK);
                this.assembleUsageCountQuery(LAST_WEEK);
            };
            refreshIntervalId = setInterval(refresh, refreshInterval);
            this.assembleUsageCountQuery(THIS_WEEK);
            this.assembleUsageCountQuery(LAST_WEEK);
        }
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentWillUnmount() {
        const { id, getWidgetChannelManager } = this.props;
        clearInterval(refreshIntervalId);
        getWidgetChannelManager().unsubscribeWidget(id + THIS_WEEK);
        getWidgetChannelManager().unsubscribeWidget(id + LAST_WEEK);
    }

    /**
     * Formats the siddhi query
     * @param {string} week - This week/Last week
     * @param {object} dataProviderConfigs - Data provider configurations
     * @memberof APIMApiUsageSummaryWidget
     * */
    assembleUsageCountQuery(week) {
        const {
            id, widgetID: widgetName, widgetConf, getWidgetChannelManager,
        } = this.props;
        const dataProviderConfigs = widgetConf.configs.providerConfig;
        dataProviderConfigs.configs.config.queryData.queryName = 'query';

        let timeTo = new Date().getTime();
        let timeFrom = Moment(timeTo).subtract(7, 'days').toDate().getTime();
        if (week === LAST_WEEK) {
            timeTo = timeFrom;
            timeFrom = Moment(timeTo).subtract(7, 'days').toDate().getTime();
        }

        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': 'day',
        };

        getWidgetChannelManager().subscribeWidget(id + week, widgetName, (message) => {
            this.handleUsageCountReceived(week, message);
        }, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleweekQuery
     * @param {string} week - This week/Last week
     * @param {object} message - data retrieved
     * @memberof APIMApiUsageSummaryWidget
     * */
    handleUsageCountReceived(week, message) {
        const { data } = message;
        const count = data[0] || [];
        if (count.length) {
            if (week === THIS_WEEK) {
                this.setState({
                    thisWeekCount: count[0] || 0,
                    inProgress: false,
                });
            }
            if (week === LAST_WEEK) {
                this.setState({
                    lastWeekCount: count[0] || 0,
                    inProgress: false,
                });
            }
        } else {
            this.setState({ inProgress: false });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Created widget
     * @memberof APIMApiUsageSummaryWidget
     */
    render() {
        const {
            faultyProviderConf, lastWeekCount, thisWeekCount, inProgress,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiCreatedProps = { themeName, lastWeekCount, thisWeekCount };

        if (inProgress) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }
        return (
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
                                        defaultMessage={'Cannot fetch provider configuration for APIM Api '
                                            + 'Created widget'}
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    ) : (
                        <APIMApiUsageSummary {...apiCreatedProps} />
                    )
                }
            </MuiThemeProvider>
        );
    }
}

APIMApiUsageSummaryWidget.propTypes = {
    height: PropTypes.number,
    getWidgetChannelManager: PropTypes.func,
    id: PropTypes.string,
    widgetID: PropTypes.string,
    widgetConf: PropTypes.instanceOf(Object),
    muiTheme: PropTypes.instanceOf(Object),
};

APIMApiUsageSummaryWidget.defaultProps = {
    height: 0,
    getWidgetChannelManager: () => {},
    id: null,
    widgetID: null,
    widgetConf: {},
    muiTheme: {},
};

withWrappedWidget(APIMApiUsageSummaryWidget, 'APIMApiUsageSummary');

export default APIMApiUsageSummaryWidget;
