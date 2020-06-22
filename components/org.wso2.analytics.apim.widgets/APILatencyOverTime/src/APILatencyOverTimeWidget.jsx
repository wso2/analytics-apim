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
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';

import { ViewTypeEnum, ValueFormatType, DrillDownEnum } from '../../AppAndAPIErrorTable/src/Constants';
import APIViewErrorTable from './APIViewErrorTable';
import CustomFormGroup from './CustomFormGroup';

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

const queryParamKey = 'latencyOverTime';

const CALLBACK_API = '-api';
const CALLBACK_VERSION = '-version';
const CALLBACK_OPERATION = '-operation';
const CALLBACK_LATENCY = '-latency';

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
 * Create React Component for AppAndAPIErrorsByTime
 * @classAPILatencyOverTimeWidget
 * @extends {Widget}
 */
class APILatencyOverTimeWidget extends Widget {
    /**
     * Creates an instance ofAPILatencyOverTimeWidget.
     * @param {any} props @inheritDoc
     * @memberofAPILatencyOverTimeWidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            loading: true,

            viewType: ViewTypeEnum.API,
            valueFormatType: ValueFormatType.PERCENT,
            drillDownType: DrillDownEnum.API,

            selectedAPI: 'all',
            selectedVersion: 'all',
            selectedResource: 'all',
            selectedLimit: 5,
            data: [],

            apiList: [],
            versionList: [],
            operationList: [],

        };

        this.styles = {
            heading: {
                margin: 'auto',
                textAlign: 'center',
                fontWeight: 'normal',
                letterSpacing: 1.5,
                paddingBottom: '10px',
                marginTop: 0,
            },
            headingWrapper: {
                margin: 'auto',
                width: '95%',
            },
            root: {
                backgroundColor: this.props.muiTheme.name === 'light' ? '#fff' : '#0e1e34',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            loading: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
            contentWrapper: {
                margin: '10px',
                marginTop: '0px',
                padding: '20px',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleQueryResults = this.handleQueryResults.bind(this);
        this.assembleFetchDataQuery = this.assembleFetchDataQuery.bind(this);

        this.loadApis = this.loadApis.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadOperations = this.loadOperations.bind(this);

        this.handleLoadApis = this.handleLoadApis.bind(this);
        this.handleLoadVersions = this.handleLoadVersions.bind(this);
        this.handleLoadOperations = this.handleLoadOperations.bind(this);

        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.renderDrillDownTable = this.renderDrillDownTable.bind(this);
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
        this.loadQueryParams();
        // This function retrieves the provider configuration defined in the widgetConf.json
        // file and make it available to be used inside the widget
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
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_API);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_VERSION);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_OPERATION);
        super.getWidgetChannelManager().unsubscribeWidget(id + CALLBACK_LATENCY);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APILatencyOverTimeWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APILatencyOverTime/locales/${locale}.json`)
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
     * @memberof APILatencyOverTimeWidget
     * */
    loadQueryParams() {
        let {
            selectedAPI, selectedVersion, selectedResource, limit: selectedLimit,
        } = super.getGlobalState(queryParamKey);
        if (!selectedLimit || selectedLimit < 0) {
            selectedLimit = 5;
            super.setGlobalState(queryParamKey, {
                selectedAPI, selectedVersion, selectedResource, selectedLimit,
            });
        }
        if (!selectedAPI) {
            selectedAPI = 'all';
        }
        if (!selectedVersion) {
            selectedVersion = 'all';
        }
        if (!selectedResource) {
            selectedResource = 'all';
        }
        this.setState({
            selectedAPI, selectedVersion, selectedResource, selectedLimit,
        });
    }

    /**
     * Updates query param values
     * @memberof APILatencyOverTimeWidget
     * */
    setQueryParam(selectedAPI, selectedVersion, selectedResource, limit) {
        super.setGlobalState(queryParamKey, {
            selectedAPI, selectedVersion, selectedResource, limit,
        });
    }

    /**
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberofAPILatencyOverTimeWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        const {
            from, to, granularity, api, version, resource,
        } = receivedMsg;
        const { selectedLimit } = this.state;

        // Insert the code to handle publisher data
        if (from && api) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                selectedAPI: api,
                selectedVersion: version,
                selectedResource: resource,
                loading: true,
            }, this.loadApis);
            super.setGlobalState(queryParamKey, {
                selectedAPI: api, selectedVersion: version, selectedResource: resource, selectedLimit,
            });
        } else if (from) {
            this.setState({
                timeFrom: from,
                timeTo: to,
                perValue: granularity,
                loading: !sync,
            }, this.loadApis);
        } else if (api) {
            this.setState({
                selectedAPI: api,
                selectedVersion: version,
                selectedResource: resource,
                loading: true,
            }, this.loadApis);
            super.setGlobalState(queryParamKey, {
                selectedAPI: api, selectedVersion: version, selectedResource: resource, selectedLimit,
            });
        }
    }

    // start of filter loading
    loadApis() {
        const {
            providerConfig, selectedAPI, selectedVersion, selectedResource,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        this.loadingDrillDownData(selectedAPI, selectedVersion, selectedResource);
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listApisQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + CALLBACK_API, widgetName, this.handleLoadApis, dataProviderConfigs);
    }

    loadVersions() {
        const { providerConfig, selectedAPI } = this.state;
        const { id, widgetID: widgetName } = this.props;

        if (selectedAPI && selectedAPI !== 'all') {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'listVersionsQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{selectedAPI}}': selectedAPI,
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + CALLBACK_VERSION, widgetName, this.handleLoadVersions, dataProviderConfigs);
        }
    }

    loadOperations() {
        const { providerConfig, selectedVersion, versionList } = this.state;
        const { id, widgetID: widgetName } = this.props;
        if (selectedVersion && selectedVersion !== 'all') {
            // use == due to comparing int with string
            const api = versionList.find(dataUnit => dataUnit[1] == selectedVersion);
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{apiID}}': api[0],
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id + CALLBACK_OPERATION, widgetName, this.handleLoadOperations, dataProviderConfigs);
        }
    }

    handleLoadApis(message) {
        const { data } = message;
        const { selectedAPI } = this.state;
        if (data) {
            const availableApi = data.find(dataUnit => dataUnit[0] === selectedAPI);
            const apiList = data.map((dataUnit) => { return dataUnit[0]; });
            this.setState({ apiList, selectedAPI: availableApi ? selectedAPI : 'all' }, this.loadVersions);
        } else {
            this.setState({ apiList: [], loading: false });
        }
    }

    handleLoadVersions(message) {
        const { data } = message;
        const { selectedVersion } = this.state;
        if (data) {
            // use == because comparing int with string
            const availableVersion = data.find(dataUnit => dataUnit[1] == selectedVersion);
            this.setState({ versionList: data, selectedVersion: availableVersion ? selectedVersion : 'all' },
                this.loadOperations);
        } else {
            this.setState({ versionList: [], loading: false });
        }
    }

    handleLoadOperations(message) {
        const { data } = message;
        const { selectedResource } = this.state;
        if (data && data.length > 0) {
            let availableResource;
            if (selectedResource !== 'all') {
                const template = (selectedResource.split(' (')[0]).trim();
                const verb = ((selectedResource.split(' (')[1]).split(')')[0]).trim();
                availableResource = data.find(dataUnit => dataUnit[0] === template && dataUnit[1] === verb);
            }
            this.setState({
                operationList: data,
                selectedResource: availableResource ? selectedResource : 'all',
            });
        } else {
            this.setState({ operationList: data, loading: false });
        }
    }
    // end of filter loading


    // start data query functions
    assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase) {
        this.setState({ loading: true });
        const {
            timeFrom, timeTo, perValue, providerConfig, selectedLimit,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'drillDownQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{limit}}': selectedLimit,
            '{{selectPhase}}': selectPhase.join(','),
            '{{groupByPhase}}': 'group by ' + groupByPhase.join(','),
            '{{querystring}}': filterPhase.length > 0 ? 'on ' + filterPhase.join(' AND ') : '',
            '{{orderBy}}': 'order by AGG_TIMESTAMP asc',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id + CALLBACK_LATENCY, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberofAPILatencyOverTimeWidget
     * */
    handleQueryResults(message) {
        // Insert the code to handle the data received through query
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ data: newData, loading: false });
        } else {
            this.setState({ data: [], loading: false });
        }
    }
    // end data query functions


    // start table data type query constructor
    loadingDrillDownData(selectedAPI, selectedVersion, selectedResource) {
        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedAPI !== 'all') {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (selectedVersion !== 'all') {
            filterPhase.push('apiVersion==\'' + selectedVersion + '\'');
        }
        if (selectedResource !== 'all') {
            const template = (selectedResource.split(' (')[0]).trim();
            const verb = ((selectedResource.split(' (')[1]).split(')')[0]).trim();
            filterPhase.push('apiResourceTemplate==\'' + template + '\'');
            filterPhase.push('apiMethod==\'' + verb + '\'');
        }

        selectPhase.push('AGG_TIMESTAMP',
            'avg(responseTime * 1.0) as responseTime',
            'avg(backendLatency * 1.0) as backendLatency',
            'avg(securityLatency * 1.0) as securityLatency',
            'avg(throttlingLatency * 1.0) as throttlingLatency',
            'avg(requestMedLat * 1.0) as requestMedLat',
            'avg(responseMedLat * 1.0) as responseMedLat');
        groupByPhase.push('AGG_TIMESTAMP');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleAPIChange(event) {
        const { selectedLimit } = this.state;
        this.loadingDrillDownData(event.target.value, 'all', 'all');
        this.setQueryParam(event.target.value, 'all', 'all', selectedLimit);
        this.setState({
            selectedAPI: event.target.value,
            selectedVersion: 'all',
            selectedResource: 'all',
            versionList: [],
            operationList: [],
            loading: true,
        },
        this.loadVersions);
    }

    handleVersionChange(event) {
        const { selectedAPI, selectedLimit } = this.state;
        this.loadingDrillDownData(selectedAPI, event.target.value, 'all');
        this.setQueryParam(selectedAPI, event.target.value, 'all', selectedLimit);
        this.setState({
            selectedVersion: event.target.value,
            selectedResource: 'all',
            operationList: [],
            loading: true,
        }, this.loadOperations);
    }

    handleOperationChange(event) {
        const { selectedAPI, selectedVersion, selectedLimit } = this.state;
        this.loadingDrillDownData(selectedAPI, selectedVersion, event.target.value);
        this.setQueryParam(selectedAPI, selectedVersion, event.target.value, selectedLimit);
        this.setState({ selectedResource: event.target.value, loading: true });
    }

    handleLimitChange(event) {
        const { selectedAPI, selectedVersion, selectedResource } = this.state;
        this.loadingDrillDownData(selectedAPI, selectedVersion, selectedResource);
        this.setQueryParam(selectedAPI, selectedVersion, selectedResource, event.target.value);
        this.setState({ selectedLimit: event.target.value, loading: true });
    }

    // end of handle filter change

    renderDrillDownTable(props) {
        return (<APIViewErrorTable {...props} />);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render theAPILatencyOverTimeWidget
     * @memberofAPILatencyOverTimeWidget
     */
    render() {
        const {
            localeMessages, viewType, drillDownType, valueFormatType, data, loading,
            selectedAPI, selectedVersion, selectedResource, selectedLimit, apiList,
            versionList, operationList,
        } = this.state;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;

        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <div style={this.styles.root} id='latency-over-time'>
                        <div style={this.styles.contentWrapper}>
                            <div style={this.styles.headingWrapper}>
                                <h3 style={this.styles.heading}>
                                    <FormattedMessage
                                        id='widget.heading'
                                        defaultMessage='API LATENCY OVER TIME'
                                    />
                                </h3>
                            </div>
                            <CustomFormGroup
                                viewType={viewType}
                                valueFormatType={valueFormatType}
                                drillDownType={drillDownType}

                                selectedAPI={selectedAPI}
                                selectedVersion={selectedVersion}
                                selectedResource={selectedResource}
                                selectedLimit={selectedLimit}

                                apiList={apiList}
                                versionList={versionList}
                                operationList={operationList}

                                handleAPIChange={this.handleAPIChange}
                                handleVersionChange={this.handleVersionChange}
                                handleOperationChange={this.handleOperationChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                            {!loading ? (
                                <this.renderDrillDownTable
                                    data={data}
                                    viewType={viewType}
                                    valueFormatType={valueFormatType}
                                    drillDownType={drillDownType}
                                    themeName={themeName}
                                />
                            )
                                : (
                                    <div style={this.styles.loading}>
                                        <CircularProgress style={this.styles.loadingIcon} />
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('APILatencyOverTime', APILatencyOverTimeWidget);
