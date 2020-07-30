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
import { Scrollbars } from 'react-custom-scrollbars';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import CircularProgress from '@material-ui/core/CircularProgress';

import { ViewTypeEnum, ValueFormatType, DrillDownEnum } from './Constants';
import APIViewErrorTable from './APIViewErrorTable';
import VersionViewErrorTable from './VersionViewErrorTable';
import CustomFormGroup from './CustomFormGroup';
import ResourceViewErrorTable from './ResourceViewErrorTable';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
    formControl: {
        minWidth: 120,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
    formControl: {
        minWidth: 120,
    },
});

const queryParamKey = 'errorSummary';

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
 * Create React Component for AppAndAPIErrorTable
 * @class AppAndAPIErrorTablewidget
 * @extends {Widget}
 */
class AppAndAPIErrorTablewidget extends Widget {
    /**
     * Creates an instance of AppAndAPIErrorTablewidget.
     * @param {any} props @inheritDoc
     * @memberof AppAndAPIErrorTablewidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,

            viewType: ViewTypeEnum.API,
            valueFormatType: ValueFormatType.PERCENT,
            drillDownType: DrillDownEnum.API,

            selectedAPI: -1,
            selectedApp: -1,
            selectedVersion: -1,
            selectedResource: -1,
            selectedLimit: 5,
            apiType: null,
            data: [],

            apiList: [],
            appList: [],
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
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handleDrillDownChange = this.handleDrillDownChange.bind(this);
        this.handleValueFormatTypeChange = this.handleValueFormatTypeChange.bind(this);
        this.handleDrillDownClick = this.handleDrillDownClick.bind(this);

        this.getQueryForAPI = this.getQueryForAPI.bind(this);
        this.getQueryForVersion = this.getQueryForVersion.bind(this);
        this.getQueryForResource = this.getQueryForResource.bind(this);

        this.loadApis = this.loadApis.bind(this);
        this.loadApps = this.loadApps.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadOperations = this.loadOperations.bind(this);

        this.handleLoadApis = this.handleLoadApis.bind(this);
        this.handleLoadApps = this.handleLoadApps.bind(this);
        this.handleLoadVersions = this.handleLoadVersions.bind(this);
        this.handleLoadOperations = this.handleLoadOperations.bind(this);

        this.handleAPIChange = this.handleAPIChange.bind(this);
        this.handleApplicationChange = this.handleApplicationChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleOperationChange = this.handleOperationChange.bind(this);
        this.handleGraphQLOperationChange = this.handleGraphQLOperationChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);

        this.loadingDrillDownData = this.loadingDrillDownData.bind(this);

        this.renderDrillDownTable = this.renderDrillDownTable.bind(this);

        this.publishSelectedData = this.publishSelectedData.bind(this);
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
        super.getWidgetChannelManager().unsubscribeWidget(id);
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadApps');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadApis');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadVersions');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadOperations');
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof AppAndAPIErrorTablewidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/AppAndAPIErrorTable/locales/${locale}.json`)
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
     * Retrieve the filter values from query param
     * @memberof AppAndAPIErrorTableWidget
     * */
    loadQueryParams() {
        let {
            viewType, valueFormatType, drillDownType, selectedAPI, selectedApp, selectedVersion, selectedResource,
            selectedLimit,
        } = super.getGlobalState(queryParamKey);
        const { apiType } = super.getGlobalState(queryParamKey);

        viewType = (!viewType) ? ViewTypeEnum.API : viewType;
        valueFormatType = (!valueFormatType) ? ValueFormatType.PERCENT : valueFormatType;
        drillDownType = (!drillDownType) ? DrillDownEnum.API : drillDownType;
        selectedLimit = (!selectedLimit || selectedLimit < 1) ? 5 : selectedLimit;
        selectedApp = (!selectedApp) ? -1 : selectedApp;
        selectedAPI = (!selectedAPI) ? -1 : selectedAPI;
        selectedVersion = (!selectedVersion) ? -1 : selectedVersion;
        selectedResource = (!selectedResource) ? -1 : selectedResource;

        this.setState({
            viewType,
            valueFormatType,
            drillDownType,
            selectedAPI,
            selectedApp,
            selectedVersion,
            selectedResource,
            selectedLimit,
            apiType,
        });
    }

    /**
     * Updates query param values
     * @memberof AppAndAPIErrorTableWidget
     * */
    setQueryParams(paramsObj) {
        const existParams = super.getGlobalState(queryParamKey);
        const newParams = {};
        for (const [key, value] of Object.entries(existParams)) {
            newParams[key] = value;
        }
        for (const [key, value] of Object.entries(paramsObj)) {
            newParams[key] = value;
        }
        super.setGlobalState(queryParamKey, newParams);
    }

    loadArtifacts() {
        const {
            selectedAPI, selectedApp, selectedVersion, selectedResource, apiType,
        } = this.state;

        this.loadApps();
        if (selectedVersion !== -1) {
            this.loadVersions(selectedAPI);
        }
        if (selectedResource !== -1) {
            this.loadOperations(selectedVersion, apiType);
        }
        if (selectedVersion === -1 && selectedResource === -1 && selectedApp === -1) {
            this.loadApis();
        }
    }

    delayedLoadApps() {
        const {
            selectedVersion, selectedResource, selectedApp,
        } = this.state;
        if (selectedVersion === -1 && selectedResource === -1 && selectedApp !== -1) {
            this.loadApis();
        }
    }

    delayedLoadVersions() {
        const {
            selectedVersion, selectedResource,
        } = this.state;
        if (selectedVersion !== -1 && selectedResource === -1) {
            this.loadApis();
        }
    }

    delayedLoadOperations() {
        const {
            selectedVersion, selectedResource,
        } = this.state;
        if (selectedVersion !== -1 && selectedResource !== -1) {
            this.loadApis();
        }
    }

    /**
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberof AppAndAPIErrorTablewidget
     * */
    handlePublisherParameters(receivedMsg) {
        const {
            from, to, granularity, viewType, errorType, selected,
        } = receivedMsg;
        const { appList } = this.state;

        if (from && to && granularity) {
            this.setState({
                // Insert the code to handle publisher data
                timeFrom: receivedMsg.from,
                timeTo: receivedMsg.to,
                perValue: receivedMsg.granularity,
            }, this.loadArtifacts);
        }
        if (viewType && errorType && selected) {
            if (viewType === ViewTypeEnum.APP) {
                const app = appList.find(d => d.NAME === selected.name && d.CREATED_BY === selected.owner);
                this.setQueryParams({
                    drillDownType: DrillDownEnum.API,
                    viewType,
                    selectedApp: app.APPLICATION_ID,
                    selectedAPI: -1,
                });
                this.setState(
                    {
                        drillDownType: DrillDownEnum.API,
                        viewType,
                        selectedApp: app.APPLICATION_ID,
                        selectedAPI: -1,
                    }, this.loadingDrillDownData,
                );
            } else {
                this.setQueryParams({ drillDownType: DrillDownEnum.API, viewType, selectedAPI: selected });
                this.setState(
                    {
                        drillDownType: DrillDownEnum.API,
                        viewType,
                        selectedAPI: selected,
                    }, this.loadingDrillDownData,
                );
            }
            document.getElementById('AppAndAPIErrorTable').scrollIntoView();
        }
    }

    // start of filter loading
    loadApps() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs = dataProviderConfigs.listAppsQueryConfigs;
        const { config } = dataProviderConfigs.configs;
        config.queryData.queryName = 'listAppsQuery';
        dataProviderConfigs.configs.config = config;
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadApps', widgetName, this.handleLoadApps, dataProviderConfigs);
    }

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
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadVersions');
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadOperations');
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadVersions', widgetName, this.handleLoadVersions, dataProviderConfigs);
    }

    loadOperations(selectedVersion, apiType) {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        if (apiType === 'APIProduct') {
            dataProviderConfigs.configs = dataProviderConfigs.listProductQueryConfigs;
            const { config } = dataProviderConfigs.configs;
            config.queryData.queryName = 'productOperationsQuery';
            dataProviderConfigs.configs.config = config;
        } else {
            dataProviderConfigs.configs.config.queryData.queryName = 'listOperationsQuery';
        }
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{selectedVersion}}': selectedVersion,
        };
        super.getWidgetChannelManager().unsubscribeWidget(id + '_loadOperations');
        super.getWidgetChannelManager()
            .subscribeWidget(id + '_loadOperations', widgetName, this.handleLoadOperations, dataProviderConfigs);
    }

    handleLoadApps(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[(names[j]).toUpperCase()] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ appList: newData }, this.delayedLoadApps);
        } else {
            this.setState({ appList: [] });
        }
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
            this.setState({
                apiList: newData,
            });
        } else {
            this.setState({
                apiList: [], selectedVersion: -1, selectedResource: -1,
            });
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
            this.setState({ versionList: newData }, this.delayedLoadVersions);
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
            this.setState({ operationList: newData }, this.delayedLoadOperations);
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
            '{{groupByPhase}}': groupByPhase.join(','),
            '{{querystring}}': filterPhase.length > 0 ? 'AND ' + filterPhase.join(' AND ') : '',
            '{{orderBy}}': '',
        };
        // Use this method to subscribe to the endpoint via web socket connection
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberof AppAndAPIErrorTablewidget
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


    // start handling table data type
    handleViewChange(event) {
        const viewType = event.target.value;
        this.setQueryParams({ viewType });
        this.setState({ viewType }, this.loadingDrillDownData);
        if (viewType === ViewTypeEnum.APP) {
            this.loadApps();
        }
    }

    handleValueFormatTypeChange(event) {
        const valueFormatType = event.target.value;
        this.setQueryParams({ valueFormatType });
        this.setState({ valueFormatType });
    }

    handleDrillDownChange(event) {
        const drillDownType = event.target.value;
        this.setQueryParams({
            drillDownType,
            selectedApp: -1,
            selectedAPI: -1,
            selectedVersion: -1,
            selectedResource: -1,
        });
        this.setState(
            {
                drillDownType,
                data: [],
                selectedApp: -1,
                selectedAPI: -1,
                selectedVersion: -1,
                selectedResource: -1,
                versionList: [],
                operationList: [],
            }, this.loadingDrillDownData,
        );
    }
    // end handling table data type


    // start table data type query constructor
    loadingDrillDownData() {
        const { drillDownType } = this.state;
        if (drillDownType === DrillDownEnum.API) {
            this.getQueryForAPI();
        } else if (drillDownType === DrillDownEnum.VERSION) {
            this.getQueryForVersion();
        } else if (drillDownType === DrillDownEnum.RESOURCE) {
            this.getQueryForResource();
        }
    }

    getQueryForAPI() {
        const {
            selectedAPI, selectedApp, viewType, appList,
        } = this.state;
        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        }
        if (selectedApp !== -1) {
            const app = appList.find(d => d.APPLICATION_ID === selectedApp);
            filterPhase.push('applicationName==\'' + app.NAME + '\'');
            filterPhase.push('applicationOwner==\'' + app.CREATED_BY + '\'');
        }

        if (viewType === ViewTypeEnum.APP) {
            selectPhase.push('applicationName', 'applicationOwner');
            groupByPhase.push('applicationName', 'applicationOwner');
        }
        selectPhase.push('apiName', 'sum(_2xx) as _2xx', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(responseCount) as responseCount',
            'sum(faultCount) as faultCount', 'sum(throttledCount) as throttledCount');
        groupByPhase.push('apiName');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    getQueryForVersion() {
        const {
            selectedAPI, selectedApp, selectedVersion, viewType, versionList, appList,
        } = this.state;

        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        } else {
            this.setState({ data: [] });
            return;
        }
        if (selectedVersion !== -1) {
            const api = versionList.find(i => i.API_ID === selectedVersion);
            filterPhase.push('apiVersion==\'' + api.API_VERSION + '\'');
        }

        if (selectedApp !== -1) {
            const app = appList.find(d => d.APPLICATION_ID === selectedApp);
            filterPhase.push('applicationName==\'' + app.NAME + '\'');
            filterPhase.push('applicationOwner==\'' + app.CREATED_BY + '\'');
        }

        if (viewType === ViewTypeEnum.APP) {
            selectPhase.push('applicationName', 'applicationOwner');
            groupByPhase.push('applicationName', 'applicationOwner');
        }
        selectPhase.push('apiVersion', 'sum(_2xx) as _2xx', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(responseCount) as responseCount',
            'sum(faultCount) as faultCount', 'sum(throttledCount) as throttledCount');
        groupByPhase.push('apiVersion');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    getQueryForResource() {
        const {
            selectedAPI, selectedApp, selectedVersion, selectedResource, viewType, versionList, operationList, appList,
        } = this.state;

        const selectPhase = [];
        const groupByPhase = [];
        const filterPhase = [];

        if (selectedApp !== -1) {
            const app = appList.find(d => d.APPLICATION_ID === selectedApp);
            filterPhase.push('applicationName==\'' + app.NAME + '\'');
            filterPhase.push('applicationOwner==\'' + app.CREATED_BY + '\'');
        }
        if (selectedAPI !== -1) {
            filterPhase.push('apiName==\'' + selectedAPI + '\'');
        } else {
            this.setState({ data: [] });
            return;
        }
        if (selectedVersion > -1) {
            const api = versionList.find(i => i.API_ID === selectedVersion);
            filterPhase.push('apiVersion==\'' + api.API_VERSION + '\'');
        } else {
            this.setState({ data: [] });
            return;
        }
        if (Array.isArray(selectedResource)) {
            if (selectedResource.length > 0) {
                const opsString = selectedResource
                    .map(id => operationList.find(i => i.URL_MAPPING_ID === id))
                    .map(d => d.URL_PATTERN)
                    .sort()
                    .join(',');
                const firstOp = operationList.find(i => i.URL_MAPPING_ID === selectedResource[0]);
                filterPhase.push('apiResourceTemplate==\'' + opsString + '\'');
                filterPhase.push('apiMethod==\'' + firstOp.HTTP_METHOD + '\'');
            }
        } else if (selectedResource > -1) {
            const operation = operationList.find(i => i.URL_MAPPING_ID === selectedResource);
            filterPhase.push('apiResourceTemplate==\'' + operation.URL_PATTERN + '\'');
            filterPhase.push('apiMethod==\'' + operation.HTTP_METHOD + '\'');
        }

        if (viewType === ViewTypeEnum.APP) {
            selectPhase.push('applicationName', 'applicationOwner');
            groupByPhase.push('applicationName', 'applicationOwner');
        }
        selectPhase.push('apiResourceTemplate', 'apiMethod', 'sum(_2xx) as _2xx', 'sum(_4xx) as _4xx',
            'sum(_5xx) as _5xx', 'sum(responseCount) as responseCount',
            'sum(faultCount) as faultCount', 'sum(throttledCount) as throttledCount');
        groupByPhase.push('apiResourceTemplate', 'apiMethod');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // start of handle filter change
    handleApplicationChange(data) {
        let selectedApp;
        if (data == null) {
            selectedApp = -1;
        } else {
            const { value } = data;
            selectedApp = value;
        }
        this.setQueryParams({ selectedApp });
        this.setState({
            selectedApp,
        }, this.loadingDrillDownData);
    }

    handleAPIChange(data) {
        let selectedAPI;
        if (data == null) {
            selectedAPI = -1;
        } else {
            const { value } = data;
            selectedAPI = value;
            const { drillDownType } = this.state;
            if (drillDownType === DrillDownEnum.VERSION || drillDownType === DrillDownEnum.RESOURCE) {
                this.loadVersions(selectedAPI);
            }
        }
        this.setQueryParams({
            selectedAPI,
            selectedVersion: -1,
            selectedResource: -1,
        });
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
        let apiType;
        if (data == null) {
            selectedVersion = -1;
        } else {
            const { value } = data;
            selectedVersion = value;
            const { drillDownType, versionList } = this.state;
            const selectedAPI = versionList.find(item => item.API_ID === selectedVersion);
            apiType = selectedAPI.API_TYPE;
            if (selectedVersion) {
                if (drillDownType === DrillDownEnum.RESOURCE && selectedAPI.API_TYPE !== 'WS') {
                    this.loadOperations(selectedVersion, selectedAPI.API_TYPE);
                }
            }
        }
        this.setQueryParams({ selectedVersion, selectedResource: -1, apiType });
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
        this.setQueryParams({ selectedResource });
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
        let limit = (event.target.value).replace('-', '').split('.')[0];
        if (limit < 1) {
            limit = 5;
        }
        if (limit) {
            this.setQueryParams({ selectedLimit: limit });
            this.setState({ selectedLimit: limit, loading: true }, this.loadingDrillDownData);
        } else {
            const { id } = this.props;
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ selectedLimit: limit, data: [], loading: false });
        }
    }

    // end of handle filter change

    renderDrillDownTable(props) {
        const { drillDownType } = props;
        if (drillDownType === DrillDownEnum.API) {
            return (<APIViewErrorTable {...props} />);
        } else if (drillDownType === DrillDownEnum.VERSION) {
            return (<VersionViewErrorTable {...props} />);
        } else if (drillDownType === DrillDownEnum.RESOURCE) {
            return (<ResourceViewErrorTable {...props} />);
        }
        return '';
    }

    handleDrillDownClick(selected) {
        const {
            drillDownType, versionList, operationList, viewType, appList,
        } = this.state;
        if (drillDownType === DrillDownEnum.API) {
            this.setQueryParams({ selectedAPI: selected, drillDownType: DrillDownEnum.VERSION });
            this.setState({ selectedAPI: selected, drillDownType: DrillDownEnum.VERSION }, this.loadingDrillDownData);
            this.loadVersions(selected);
        } else if (drillDownType === DrillDownEnum.VERSION) {
            const api = versionList.find(d => d.API_VERSION === selected);
            if (api.API_TYPE === 'WS') {
                console.debug('WS APIs doesn\'t support resource level drill down');
                return;
            }
            this.setQueryParams({
                selectedVersion: api.API_ID, drillDownType: DrillDownEnum.RESOURCE, apiType: api.API_TYPE,
            });
            this.setState({
                selectedVersion: api.API_ID, drillDownType: DrillDownEnum.RESOURCE, apiType: api.API_TYPE,
            }, this.loadingDrillDownData);
            this.loadOperations(api.API_ID, api.API_TYPE);
        } else if (drillDownType === DrillDownEnum.RESOURCE) {
            const { selectedAPI, selectedVersion, apiList } = this.state;
            const {
                applicationName, applicationOwner, apiResourceTemplate, apiMethod,
            } = selected;
            const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
            let operationIds;
            if (graphQLOps.includes(apiMethod)) {
                const selectedOperations = apiResourceTemplate.split(',');
                operationIds = selectedOperations.map((op) => {
                    const foundOp = operationList.find(i => i.URL_PATTERN === op
                        && i.HTTP_METHOD === apiMethod);
                    return foundOp.URL_MAPPING_ID;
                });
            } else {
                const operation = operationList.find(i => i.URL_PATTERN === apiResourceTemplate
                    && i.HTTP_METHOD === apiMethod);
                operationIds = operation.URL_MAPPING_ID;
            }
            const apiType = apiList.find(i => i.API_NAME === selectedAPI).API_TYPE;
            const status = {
                apiName: selectedAPI, apiID: selectedVersion, operationID: operationIds, apiType,
            };
            if (viewType === ViewTypeEnum.APP) {
                const app = appList.find(d => d.NAME === applicationName && d.CREATED_BY === applicationOwner);
                status.appID = app.APPLICATION_ID;
            }
            this.publishSelectedData(status);
        }
        return '';
    }

    publishSelectedData(message) {
        super.publish(message);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the AppAndAPIErrorTablewidget
     * @memberof AppAndAPIErrorTablewidget
     */
    render() {
        const {
            localeMessages, viewType, drillDownType, valueFormatType, data, loading,
            selectedAPI, selectedApp, selectedVersion, selectedResource, selectedLimit, apiList, appList,
            versionList, operationList, height,
        } = this.state;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const { username } = super.getCurrentUser();

        const styles = {
            // Insert styles Here
            mainDiv: {
                backgroundColor: '#0e1e33',
                padding: '20px',
                height: this.props.height,
            },
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
            dataWrapper: {
                margin: 'auto',
                height: '500px',
                width: '95%',
            },
            title: {
                textAlign: 'center',
                marginTop: '100px',
                marginBottom: '50px',
                fontWeight: 'bold',
                letterSpacing: 1.5,
            },
            contentWrapper: {
                margin: '10px',
                marginTop: '0px',
                padding: '20px',
            },
            root: {
                backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
                height: '100%',
            },
            formControl: {
                minWidth: '120px',
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
        };
        return (
            <IntlProvider
                locale={language}
                messages={localeMessages}
            >
                <MuiThemeProvider
                    theme={themeName === 'dark' ? darkTheme : lightTheme}
                >
                    <Scrollbars style={{
                                    height,
                                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                                }}
                    >
                        <div style={styles.root} id='AppAndAPIErrorTable'>
                            <div style={styles.contentWrapper}>
                                <div style={styles.headingWrapper}>
                                    <h3 style={styles.heading}>
                                        <FormattedMessage
                                            id='widget.heading'
                                            defaultMessage='ERROR SUMMARY'
                                        />
                                    </h3>
                                </div>
                                <div style={styles.dataWrapper}>
                                    <FormControl component='fieldset'>
                                        <RadioGroup
                                            row
                                            aria-label='viewType'
                                            name='view'
                                            value={viewType}
                                            onChange={this.handleViewChange}
                                        >
                                            <FormControlLabel
                                                value={ViewTypeEnum.APP}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='view.appAndApi'
                                                        defaultMessage='Application and API View'
                                                    />
                                                )}
                                            />
                                            <FormControlLabel
                                                value={ViewTypeEnum.API}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='view.api'
                                                        defaultMessage='API View'
                                                    />
                                                )}
                                            />
                                        </RadioGroup>
                                        <RadioGroup
                                            row
                                            value={valueFormatType}
                                            onChange={this.handleValueFormatTypeChange}
                                        >
                                            <FormControlLabel
                                                value={ValueFormatType.COUNT}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='value.count'
                                                        defaultMessage='Count'
                                                    />
                                                )}
                                            />
                                            <FormControlLabel
                                                value={ValueFormatType.PERCENT}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='value.percentage'
                                                        defaultMessage='Percentage'
                                                    />
                                                )}
                                            />
                                        </RadioGroup>
                                        <RadioGroup
                                            row
                                            value={drillDownType}
                                            onChange={this.handleDrillDownChange}
                                        >
                                            <FormControlLabel
                                                value={DrillDownEnum.API}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='drill.api'
                                                        defaultMessage='API'
                                                    />
                                                )}
                                            />
                                            <FormControlLabel
                                                value={DrillDownEnum.VERSION}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='drill.version'
                                                        defaultMessage='Version'
                                                    />
                                                )}
                                            />
                                            <FormControlLabel
                                                value={DrillDownEnum.RESOURCE}
                                                control={<Radio />}
                                                label={(
                                                    <FormattedMessage
                                                        id='drill.resource'
                                                        defaultMessage='Resource'
                                                    />
                                                )}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                    <CustomFormGroup
                                        viewType={viewType}
                                        valueFormatType={valueFormatType}
                                        drillDownType={drillDownType}

                                        selectedApp={selectedApp}
                                        selectedAPI={selectedAPI}
                                        selectedVersion={selectedVersion}
                                        selectedResource={selectedResource}
                                        selectedLimit={selectedLimit}

                                        apiList={apiList}
                                        appList={appList}
                                        versionList={versionList}
                                        operationList={operationList}

                                        handleApplicationChange={this.handleApplicationChange}
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
                                            drillDownType={drillDownType}
                                            handleDrillDownClick={this.handleDrillDownClick}
                                            username={username}
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
                        </div>
                    </Scrollbars>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('AppAndAPIErrorTable', AppAndAPIErrorTablewidget);
