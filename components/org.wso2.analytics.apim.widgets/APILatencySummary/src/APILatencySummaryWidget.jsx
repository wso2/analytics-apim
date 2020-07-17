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
import CustomFormGroup from './CustomFormGroup';
import ResourceViewErrorTable from './ResourceViewErrorTable';

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
 * Create React Component for AppAndAPIErrorsByTime
 * @class APILatencySummaryWidget
 * @extends {Widget}
 */
class APILatencySummaryWidget extends Widget {
    /**
     * Creates an instance of APILatencySummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof APILatencySummaryWidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            loading: true,

            selectedAPI: -1,
            selectedVersion: -1,
            selectedResource: -1,
            selectedLimit: 5,
            data: [],

            apiList: [],
            versionList: [],
            operationList: [],

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

        this.getQueryForResource = this.getQueryForResource.bind(this);

        this.loadApis = this.loadApis.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadOperations = this.loadOperations.bind(this);

        this.handleLoadApis = this.handleLoadApis.bind(this);
        this.handleLoadVersions = this.handleLoadVersions.bind(this);
        this.handleLoadOperations = this.handleLoadOperations.bind(this);

        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleGraphQLOperationChange = this.handleGraphQLOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.renderDrillDownTable = this.renderDrillDownTable.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(id);
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadApis');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadVersions');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadOperations');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadOperations');
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APILatencySummaryWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APILatencySummary/locales/${locale}.json`)
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
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberof APILatencySummaryWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;
        this.setState({
            // Insert the code to handle publisher data
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            loading: !sync,
        }, this.loadApis);
    }


    // start of filter loading
    loadApis() {
        this.loadingDrillDownData();

        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listApisQuery';
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadApis', widgetName, this.handleLoadApis, dataProviderConfigs);
    }

    loadVersions(selectedAPI) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listVersionsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedAPI}}': selectedAPI,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadVersions', widgetName, this.handleLoadVersions, dataProviderConfigs);
    }

    loadOperations(selectedVersion) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedVersion}}': selectedVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadOperations', widgetName, this.handleLoadOperations, dataProviderConfigs);
    }

    handleLoadApis(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });
        if (data.length !== 0) {
            this.setState({ apiList: newData }, this.versionLoadCallBack);
        } else {
            this.setState({ apiList: [] });
        }
    }

    handleLoadVersions(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ versionList: newData, selectedResource: -1 });
        } else {
            this.setState({ versionList: [], selectedResource: -1 });
        }
    }

    handleLoadOperations(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ operationList: newData });
        } else {
            this.setState({ operationList: [] });
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
        super.getWidgetChannelManager().unsubscribeWidget(id);

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
            '{{orderBy}}': 'order by responseTime desc',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberof APILatencySummaryWidget
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
    loadingDrillDownData() {
        this.getQueryForResource();
    }

    getQueryForResource() {
        const {
            selectedAPI, selectedVersion, selectedResource, versionList, operationList,
        } = this.state;

        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (selectedVersion > -1) {
            const api = versionList.find(i => i.API_ID === selectedVersion);
            filterPhase.push('apiVersion==\'' + api.API_VERSION + '\'');
        }
        if (Array.isArray(selectedResource)) {
            if (selectedResource.length > 0) {
                const opsString = selectedResource
                    .map(id => operationList.find(i => i.URL_MAPPING_ID === id))
                    .map(d => d.URL_PATTERN).join(',');
                const firstOp = operationList.find(i => i.URL_MAPPING_ID === selectedResource[0]);
                filterPhase.push('apiResourceTemplate==\'' + opsString + '\'');
                filterPhase.push('apiMethod==\'' + firstOp.HTTP_METHOD + '\'');
            }
        } else {
            if (selectedResource > -1) {
                const operation = operationList.find(i => i.URL_MAPPING_ID === selectedResource);
                filterPhase.push('apiResourceTemplate==\'' + operation.URL_PATTERN + '\'');
                filterPhase.push('apiMethod==\'' + operation.HTTP_METHOD + '\'');
            }
        }

        selectPhase.push('apiName', 'apiVersion', 'apiResourceTemplate', 'apiMethod',
            'max(responseTime * 1.0) as responseTime',
            'max(backendLatency * 1.0) as backendLatency',
            'max(securityLatency * 1.0) as securityLatency',
            'max(throttlingLatency * 1.0) as throttlingLatency',
            'max(requestMedLat * 1.0) as requestMedLat',
            'max(responseMedLat * 1.0) as responseMedLat',
            'max((responseTime - backendLatency - securityLatency - throttlingLatency - requestMedLat - '
            + 'responseMedLat) * 1.0) as miscellaneous');
        groupByPhase.push('apiName', 'apiVersion', 'apiResourceTemplate', 'apiMethod');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleAPIChange(data) {
        let selectedAPI;
        if (data == null) {
            selectedAPI = -1;
        } else {
            const { value } = data;
            selectedAPI = value;
            this.loadVersions(selectedAPI);
        }
        this.setState({
            selectedAPI,
            versionList: [],
            operationList: [],
            selectedVersion: -1,
            selectedResource: -1,
        }, this.loadingDrillDownData);
    }

    handleVersionChange(data) {
        let selectedVersion;
        if (data == null) {
            selectedVersion = -1;
        } else {
            const { value } = data;
            selectedVersion = value;
            const { versionList } = this.state;
            const selectedAPI = versionList.find(item => item.API_ID === selectedVersion);
            if (selectedVersion && selectedAPI.API_TYPE !== 'WS') {
                this.loadOperations(selectedVersion);
            }
        }
        this.setState({
            selectedVersion,
            selectedResource: -1,
            operationList: [],
        }, this.loadingDrillDownData);
    }

    handleOperationChange(data) {
        let selectedResource;
        if (data == null) {
            selectedResource = -1;
        } else {
            const { value } = data;
            selectedResource = value;
        }
        this.setState({
            selectedResource,
        }, this.loadingDrillDownData);
    }

    handleGraphQLOperationChange(data) {
        let selectedResource;
        if (data == null || data.length === 0) {
            selectedResource = -1;
        } else {
            const ids = data.map(row => row.value);
            selectedResource = ids;
        }
        this.setState({
            selectedResource,
        }, this.loadingDrillDownData);
    }

    handleLimitChange(event) {
        const limit = (event.target.value).replace('-', '').split('.')[0];
        if (limit) {
            this.setState({ selectedLimit: limit, loading: true }, this.loadingDrillDownData);
        } else {
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ selectedLimit: limit, data: [], loading: false });
        }
    }

    // end of handle filter change

    renderDrillDownTable(props) {
        return (<ResourceViewErrorTable {...props} />);
    }

    /**
     * Handle onClick and drill down
     * @memberof APILatencySummaryWidget
     * */
    handleOnClick(event, data) {
        const { configs } = this.props;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown !== undefined && drillDown) {
                const {
                    apiName, apiVersion, apiResourceTemplate, apiMethod,
                } = data;
                const { apiList } = this.state;
                const selectedAPI = apiList.find(item => item.API_NAME === apiName);
                if (selectedAPI && selectedAPI.API_TYPE === 'WS') {
                    return;
                }
                const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
                const graphQL = graphQLOps.includes(apiMethod);
                let resource;
                if (graphQL) {
                    resource = apiResourceTemplate.split(',').map((path) => {
                        return { apiResourceTemplate: path, apiMethod };
                    });
                } else {
                    resource = { apiResourceTemplate, apiMethod };
                }
                this.publishSelection({
                    api: apiName, version: apiVersion, resource,
                });
                document.getElementById('latency-over-time').scrollIntoView();
            }
        }
        event.preventDefault();
    }

    /**
     * Publishing the selection
     * @memberof APILatencySummaryWidget
     */
    publishSelection(message) {
        super.publish(message);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APILatencySummaryWidget
     * @memberof APILatencySummaryWidget
     */
    render() {
        const {
            localeMessages, viewType, valueFormatType, data, loading,
            selectedAPI, selectedVersion, selectedResource, selectedLimit, apiList,
            versionList, operationList,
        } = this.state;
        const { muiTheme, height } = this.props;
        const themeName = muiTheme.name;

        const styles = {
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
                backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
                height: '100%',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            loading: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height,
            },
            contentWrapper: {
                margin: '10px',
                marginTop: '0px',
                padding: '20px',
            },
        };
        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <div style={styles.root}>
                        <div style={styles.contentWrapper}>
                            <div style={styles.headingWrapper}>
                                <h3 style={styles.heading}>
                                    <FormattedMessage
                                        id='widget.heading'
                                        defaultMessage='API LATENCY SUMMARY'
                                    />
                                </h3>
                            </div>
                            <CustomFormGroup
                                viewType={viewType}
                                valueFormatType={valueFormatType}

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
                                handleGraphQLOperationChange={this.handleGraphQLOperationChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                            {!loading ? (
                                <this.renderDrillDownTable
                                    data={data}
                                    viewType={viewType}
                                    valueFormatType={valueFormatType}
                                    handleOnClick={this.handleOnClick}
                                    themeName={themeName}
                                />
                            )
                                : (
                                    <div style={styles.loading}>
                                        <CircularProgress style={styles.loadingIcon} />
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
global.dashboard.registerWidget('APILatencySummary', APILatencySummaryWidget);
