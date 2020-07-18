/* eslint-disable require-jsdoc */
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
import Scrollbars from 'react-custom-scrollbars';
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
 * @class APITrafficSummaryWidget
 * @extends {Widget}
 */
class APITrafficSummaryWidget extends Widget {
    /**
     * Creates an instance of APITrafficSummaryWidget.
     * @param {any} props @inheritDoc
     * @memberof APITrafficSummaryWidget
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
            drillDownType: 'api',
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
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.handleOnClick = this.handleOnClick.bind(this);
        this.handleDrillDownTypeChange = this.handleDrillDownTypeChange.bind(this);
        this.handleGraphQLOperationChange = this.handleGraphQLOperationChange.bind(this);
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
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APITrafficSummaryWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APITrafficSummary/locales/${locale}.json`)
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
     * @memberof APITrafficSummaryWidget
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
        const { data } = message;
        const apiList = data.map(([apiName]) => {
            return apiName;
        });
        this.setState({ apiList });
    }

    handleLoadVersions(message) {
        const { data } = message;
        this.setState({ versionList: data });
    }

    handleLoadOperations(message) {
        const { data } = message;
        this.setState({ operationList: data });
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
            '{{groupByPhase}}': groupByPhase.length ? 'group by ' + groupByPhase.join(',') : '',
            '{{querystring}}': filterPhase.length > 0 ? 'on ' + filterPhase.join(' AND ') : '',
            '{{orderBy}}': 'order by responseCount desc',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberof APITrafficSummaryWidget
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

    handleDrillDownTypeChange(event) {
        this.setState(
            {
                drillDownType: event.target.value,
                data: [],
                selectedAPI: -1,
                selectedVersion: -1,
                selectedResource: -1,
                versionList: [],
                operationList: [],
            }, this.loadingDrillDownData,
        );
    }

    // start table data type query constructor
    loadingDrillDownData() {
        this.getQueryForResource();
    }

    getQueryForResource() {
        const {
            selectedAPI, selectedVersion, selectedResource, versionList, operationList, drillDownType,
        } = this.state;

        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (drillDownType === 'api') {
            groupByPhase.push('apiName');
        }
        if (drillDownType === 'version') {
            groupByPhase.push('apiName', 'apiVersion');
        }
        if (drillDownType === 'resource') {
            groupByPhase.push('apiName', 'apiResourceTemplate', 'apiVersion');
        }

        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (selectedVersion !== -1) {
            const ver = versionList.filter(([versionId]) => {
                return versionId === selectedVersion;
            });
            filterPhase.push('apiVersion==\'' + ver[0][1] + '\'');
        }
        if (Array.isArray(selectedResource)) {
            if (selectedResource.length > 0) {
                const opsString = selectedResource
                    .map(urlId => operationList.find(i => i[0] === urlId))
                    .map(([, pattern]) => pattern).join(',');

                const operation = operationList.find(i => i[0] === selectedResource[0]);
                const [, , method] = operation;

                filterPhase.push('apiResourceTemplate==\'' + opsString + '\'');
                filterPhase.push('apiMethod==\'' + method + '\'');
            }
        } else if (selectedResource > -1) {
            const operation = operationList.find(i => i[0] === selectedResource);
            const [, pattern, method] = operation;
            filterPhase.push('apiResourceTemplate==\'' + pattern + '\'');
            filterPhase.push('apiMethod==\'' + method + '\'');
        }
        selectPhase.push('apiName', 'apiVersion', 'apiResourceTemplate', 'apiMethod',
            'sum(responseCount) as responseCount',
            'sum(faultCount) as faultCount',
            'sum(throttledCount) as throttledCount');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleAPIChange(event) {
        let value;
        if (!event) {
            // handle clear dropdown
            value = -1;
        } else {
            value = event.value;
        }
        this.setState({
            selectedAPI: value,
            selectedResource: -1,
            selectedVersion: -1,
            versionList: [],
            operationList: [],
        }, this.loadingDrillDownData);
        this.loadVersions(value);
    }

    handleVersionChange(event) {
        let value;
        if (!event) {
            // handle clear dropdown
            value = -1;
        } else {
            value = event.value;
        }
        this.setState({
            selectedVersion: value,
            operationList: [],
            selectedResource: -1,
        }, this.loadingDrillDownData);
        const { versionList } = this.state;
        const api = versionList.filter(([apiVersionID]) => {
            return apiVersionID === value;
        });
        if (api && api[0]) {
            this.loadOperations(api[0][0]);
        }
    }

    handleOperationChange(event) {
        let value;
        if (!event) {
            // handle clear dropdown
            value = -1;
            return this.setState({ selectedResource: value }, this.loadingDrillDownData);
        } else {
            value = event.value;
        }
        this.setState({ selectedResource: value }, this.loadingDrillDownData);
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
        let limit = (event.target.value).replace('-', '').split('.')[0];
        if (parseInt(limit, 10) < 1) {
            limit = 5;
        }
        this.setState({ selectedLimit: limit }, this.loadingDrillDownData);
    }

    // end of handle filter change

    /**
     * Handle onClick and drill down
     * @memberof APITrafficSummaryWidget
     * */
    handleOnClick(event, data) {
        const { configs } = this.props;
        const { operationList } = this.state;

        if (configs && configs.options) {
            const { drillDown } = configs.options;

            if (drillDown !== undefined && drillDown) {
                const {
                    apiName, apiVersion, apiResourceTemplate, apiMethod,
                } = data;
                const operation = operationList.find(i => i[1] === apiResourceTemplate && i[2] === apiMethod);
                if (operation) {
                    const [resourceId] = operation;
                    this.publishSelection({
                        api: apiName, version: apiVersion, resource: resourceId,
                    });
                } else {
                    this.publishSelection({
                        api: apiName, version: apiVersion,
                    });
                }
                document.getElementById('traffic-over-time').scrollIntoView();
            }
        }
        event.preventDefault();
    }

    /**
     * Publishing the selection
     * @memberof APITrafficSummaryWidget
     */
    publishSelection(message) {
        super.publish(message);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APITrafficSummaryWidget
     * @memberof APITrafficSummaryWidget
     */
    render() {
        const {
            localeMessages, viewType, valueFormatType, data, loading,
            selectedAPI, selectedVersion, selectedResource, selectedLimit, apiList,
            versionList, operationList, drillDownType,
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
                paddingTop: '30px',
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
                        <Scrollbars style={{
                            height,
                            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                        }}
                        >
                            <div style={styles.contentWrapper}>
                                <div style={styles.headingWrapper}>
                                    <h3 style={styles.heading}>
                                        <FormattedMessage
                                            id='widget.heading'
                                            defaultMessage='API USAGE SUMMARY'
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
                                    handleDrillDownTypeChange={this.handleDrillDownTypeChange}
                                    handleGraphQLOperationChange={this.handleGraphQLOperationChange}
                                    drillDownType={drillDownType}
                                    handleLimitChange={this.handleLimitChange}
                                />
                                {!loading ? (
                                    <ResourceViewErrorTable
                                        data={data}
                                        viewType={viewType}
                                        valueFormatType={valueFormatType}
                                        handleOnClick={this.handleOnClick}
                                        themeName={themeName}
                                        drillDownType={drillDownType}
                                    />
                                )
                                    : (
                                        <div style={styles.loading}>
                                            <CircularProgress style={styles.loadingIcon} />
                                        </div>
                                    )
                                }
                            </div>
                        </Scrollbars>
                    </div>

                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('APITrafficSummary', APITrafficSummaryWidget);
