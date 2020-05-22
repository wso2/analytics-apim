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
import APIMGeoInvocations from './APIMGeoInvocations';

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
 * Create React Component for APIM Geo Based Invocations widget
 * @class APIMGeoInvocationsWidget
 * @extends {Widget}
 */
class APIMGeoInvocationsWidget extends Widget {
    /**
     * Creates an instance of APIMGeoInvocationsWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMGeoInvocationsWidget
     */
    constructor(props) {
        super(props);

        this.chartConfig = {
            x: 'Country',
            charts: [
                {
                    type: 'map',
                    y: 'count',
                    mapType: 'world',
                    colorScale: [
                        '#1565C0',
                        '#4DB6AC',
                    ],
                },
            ],
            chloropethRangeUpperbound: [20],
            chloropethRangeLowerbound: [0],
        };

        this.metadata = {
            names: ['count', 'Country'],
            types: ['linear', 'ordinal'],
        };

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
            geoData: null,
            inProgress: true,
            metadata: this.metadata,
            chartConfig: this.chartConfig,
            dimension: null,
            selectedOptions: [],
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
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
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
     * @memberof APIMGeoInvocationsWidget
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMGeoBasedInvocations/locales/${locale}.json`)
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
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMGeoInvocationsWidget
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
     * @memberof APIMGeoInvocationsWidget
     * */
    assembleMainQuery() {
        const {
            providerConfig, timeFrom, timeTo, perValue, dimension, selectedOptions,
        } = this.state;
        const { id } = this.props;
        const widgetName = this.props.widgetID;

        if (dimension && timeFrom) {
            if (selectedOptions && selectedOptions.length > 0) {
                const filterCondition = '(apiName==\'' + selectedOptions[0].name + '\' AND apiVersion==\''
                    + selectedOptions[0].version + '\' AND apiCreator==\'' + selectedOptions[0].provider + '\')';
                const dataProviderConfigs = cloneDeep(providerConfig);
                dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{timeFrom}}': timeFrom,
                    '{{timeTo}}': timeTo,
                    '{{per}}': perValue,
                    '{{filterCondition}}': filterCondition,
                };
                super.getWidgetChannelManager()
                    .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
            }
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMGeoInvocationsWidget
     * */
    handleDataReceived(message) {
        const { data } = message;

        if (data) {
            const maxCount = data.reduce((acc,cur) => cur[0] > acc ? acc = cur[0] : acc, 0);
            this.chartConfig.chloropethRangeUpperbound = [maxCount];
            this.setState({ geoData: data, inProgress: false });
        } else {
            this.setState({ inProgress: false, geoData: [] });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Geo Based Invocations widget
     * @memberof APIMGeoInvocationsWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, chartConfig, metadata, height, width, inProgress, geoData,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const geoProps = {
            themeName,
            chartConfig,
            metadata,
            height,
            width,
            geoData,
            inProgress,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Geo '
                                            + 'Based Invocations widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMGeoInvocations
                                {...geoProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMGeoBasedInvocations', APIMGeoInvocationsWidget);
