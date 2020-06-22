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
            data: [],

            apiList: [],
            appList: [],
            versionList: [],
            operationList: [],

        };

        this.styles = {
            // Insert styles Here
            mainDiv: {
                backgroundColor: '#0e1e33',
                padding: '20px',
                height: this.props.height,
            },
            h3: {
                borderBottom: '1px solid #fff',
                paddingBottom: '10px',
                margin: 'auto',
                marginTop: 0,
                textAlign: 'left',
                fontWeight: 'normal',
                letterSpacing: 1.5,
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
            content: {
                marginTop: '20px',
                textAlign: 'center',
            },
            root: {
                backgroundColor: this.props.muiTheme.name === 'light' ? '#fff' : '#0e1e34',
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
            }, this.loadApis);
        }
        if (viewType && errorType && selected) {
            if (viewType === ViewTypeEnum.APP) {
                const app = appList.find(d => d.NAME === selected.name && d.CREATED_BY === selected.owner);
                this.setState(
                    {
                        drillDownType: DrillDownEnum.API,
                        viewType,
                        selectedApp: app.APPLICATION_ID,
                        selectedAPI: -1,
                    }, this.loadingDrillDownData,
                );
            } else {
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
        const { viewType } = this.state;
        this.loadingDrillDownData();
        this.loadApps();
        if (viewType === ViewTypeEnum.APP) {
            this.loadApps();
        }

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

    handleLoadApps(message) {
        const { data, metadata: { names } } = message;
        const newData = data.map((row) => {
            const obj = {};
            for (let j = 0; j < row.length; j++) {
                obj[names[j]] = row[j];
            }
            return obj;
        });

        if (data.length !== 0) {
            this.setState({ appList: newData });
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
                apiList: newData, selectedVersion: -1, selectedResource: -1,
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
        this.setState({ viewType: event.target.value }, this.loadingDrillDownData);
        if (event.target.value === ViewTypeEnum.APP) {
            this.loadApps();
        }
    }

    handleValueFormatTypeChange(event) {
        this.setState({ valueFormatType: event.target.value });
    }

    handleDrillDownChange(event) {
        this.setState(
            {
                drillDownType: event.target.value,
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
        selectPhase.push('apiName', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(successCount) as successCount',
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
        selectPhase.push('apiVersion', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(successCount) as successCount',
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
            return;
        }
        if (selectedVersion > -1) {
            const api = versionList.find(i => i.API_ID === selectedVersion);
            filterPhase.push('apiVersion==\'' + api.API_VERSION + '\'');
        } else {
            return;
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

        if (viewType === ViewTypeEnum.APP) {
            selectPhase.push('applicationName', 'applicationOwner');
            groupByPhase.push('applicationName', 'applicationOwner');
        }
        selectPhase.push('apiResourceTemplate', 'apiMethod', 'sum(_4xx) as _4xx', 'sum(_5xx) as _5xx',
            'sum(successCount) as successCount',
            'sum(faultCount) as faultCount', 'sum(throttledCount) as throttledCount');
        groupByPhase.push('apiResourceTemplate', 'apiMethod');
        this.assembleFetchDataQuery(selectPhase, groupByPhase, filterPhase);
    }

    // end table data type query constructor


    // start of handle filter change
    handleApplicationChange(data) {
        let selectedApp;
        if (data == null) {
            selectedApp = -1;
        } else {
            const { value } = data;
            selectedApp = value;
        }
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
                this.loadVersions(event.target.value);
            }
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
            const { drillDownType } = this.state;
            if (drillDownType === DrillDownEnum.RESOURCE && event.target.value >= 0) {
                this.loadOperations(event.target.value);
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
        this.setState({ selectedLimit: event.target.value }, this.loadingDrillDownData);
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
            this.setState({ selectedAPI: selected, drillDownType: DrillDownEnum.VERSION }, this.loadingDrillDownData);
            this.loadVersions(selected);
        } else if (drillDownType === DrillDownEnum.VERSION) {
            const api = versionList.find(d => d.API_VERSION === selected);
            this.setState({
                selectedVersion: api.API_ID, drillDownType: DrillDownEnum.RESOURCE,
            }, this.loadingDrillDownData);
            this.loadOperations(api.API_ID);
        } else if (drillDownType === DrillDownEnum.RESOURCE) {
            const { selectedAPI, selectedVersion } = this.state;
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
                console.log(operationIds);
            } else {
                const operation = operationList.find(i => i.URL_PATTERN === apiResourceTemplate
                    && i.HTTP_METHOD === apiMethod);
                operationIds = operation.URL_MAPPING_ID;
            }
            const status = {
                apiName: selectedAPI, apiID: selectedVersion, operationID: operationIds,
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
                    <div style={this.styles.root} id='AppAndAPIErrorTable'>
                        <div style={this.styles.headingWrapper}>
                            <h3 style={this.styles.h3}>
                                <FormattedMessage
                                    id='widget.heading.error.summary'
                                    defaultMessage='Error Summary'
                                />
                            </h3>
                        </div>
                        <div style={this.styles.dataWrapper}>
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
                                        label='Application and API View'
                                    />
                                    <FormControlLabel value={ViewTypeEnum.API} control={<Radio />} label='API View' />
                                </RadioGroup>
                                <RadioGroup
                                    row
                                    aria-label='gender'
                                    name='gender1'
                                    value={valueFormatType}
                                    onChange={this.handleValueFormatTypeChange}
                                >
                                    <FormControlLabel value={ValueFormatType.COUNT} control={<Radio />} label='Count' />
                                    <FormControlLabel
                                        value={ValueFormatType.PERCENT}
                                        control={<Radio />}
                                        label='Percentage'
                                    />
                                </RadioGroup>
                                <RadioGroup
                                    row
                                    aria-label='gender'
                                    name='gender1'
                                    value={drillDownType}
                                    onChange={this.handleDrillDownChange}
                                >
                                    <FormControlLabel value={DrillDownEnum.API} control={<Radio />} label='API' />
                                    <FormControlLabel
                                        value={DrillDownEnum.VERSION}
                                        control={<Radio />}
                                        label='Version'
                                    />
                                    <FormControlLabel
                                        value={DrillDownEnum.RESOURCE}
                                        control={<Radio />}
                                        label='Resource'
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
global.dashboard.registerWidget('AppAndAPIErrorTable', AppAndAPIErrorTablewidget);
