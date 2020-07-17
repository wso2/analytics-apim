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
import {
    addLocaleData, defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import Axios from 'axios';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import PersonIcon from '@material-ui/icons/Person';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import CustomIcon from './CustomIcon';

const DIMENSION_API = 'api';
const DIMENSION_PROVIDER = 'api provider';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
        action: {
            disabled: 'dark',
        },
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
        action: {
            disabled: 'light',
        },
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
 * Create React Component for Dimension Selector Widget
 * @class DimensionSelectorWidget
 * @extends {Widget}
 */
class DimensionSelectorWidget extends Widget {
    /**
     * Creates an instance of DimensionSelectorWidget.
     * @param {any} props @inheritDoc
     * @memberof DimensionSelectorWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            apis: [],
            providers: [],
            dimension: null,
            options: null,
            optionLabel: null,
            refreshInterval: 3600000, // 1hr
            refreshIntervalId: null,
            inProgress: true,
            proxyError: false,
            selectedOptions: [],
            selectMultiple: true,
            selectedDimensions: [],
            defaultDimension: null,
            apiResponse: null,
            roleValidationResponse: null,
            isRoleValidated: false,
            isManager: false,
            selectAll: true,
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
            loading: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
            proxyPaperWrapper: {
                height: '75%',
            },
            proxyPaper: {
                background: '#969696',
                width: '75%',
                padding: '4%',
                border: '1.5px solid #fff',
                margin: 'auto',
                marginTop: '5%',
            },
            root: {
                paddingTop: '20px',
                margin: 'auto',
                display: 'flex',
                width: '95%',
            },
            search: {
                width: '80%',
                margin: 'auto',
            },
            dimensionButton: {
                height: '100%',
                width: '15%',
                margin: 'auto',
                padding: '10px',
                minWidth: '120px',
            },
            button: {
                minHeight: '55px',
            },
            helperText: {
                color: '#9e9e9e',
                margin: 'auto',
                justifyContent: 'center',
                display: 'flex',
                paddingLeft: '20px',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.formatPublisherApiList = this.formatPublisherApiList.bind(this);
        this.handleApiDataReceived = this.handleApiDataReceived.bind(this);
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentDidMount() {
        const { refreshInterval } = this.state;
        const { widgetID } = this.props;
        this.validateLoggedInUserRole();
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                const refresh = () => {
                    this.loadAPIList();
                };
                const refreshIntervalId = setInterval(refresh, refreshInterval);
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                    refreshIntervalId,
                }, this.loadAPIList);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConf: true,
                });
            });
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentDidUpdate() {
        const { apiResponse, roleValidationResponse } = this.state;
        if (apiResponse) {
            this.formatPublisherApiList(apiResponse);
        }
        if (roleValidationResponse) {
            this.loadDefaultValues();
        }
    }

    /**
     *
     * @param {any} props @inheritDoc
     */
    componentWillUnmount() {
        const { refreshIntervalId } = this.state;
        clearInterval(refreshIntervalId);
    }

    /**
     * Load locale file.
     * @memberof DimensionSelectorWidget
     * @param {String} locale - locale
     * @returns {Promise}
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/DimensionSelector/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ messages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Get API list from Publisher
     * @memberof DimensionSelectorWidget
     * */
    validateLoggedInUserRole() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/isManager`)
            .then((response) => {
                this.setState({ proxyError: false, isRoleValidated: true, roleValidationResponse: response.data });
            })
            .catch((error) => {
                this.setState({ proxyError: true, inProgress: false });
                console.error(error);
            });
    }

    /**
     * Load the default values based on widget config
     * @param {any} props @inheritDoc
     */
    loadDefaultValues() {
        const { configs } = this.props;
        const { roleValidationResponse } = this.state;
        let selectAll = true;
        let selectMultiple = true;
        let defaultDimension = DIMENSION_API;
        let selectedDimensions = [DIMENSION_API, DIMENSION_PROVIDER];

        if (configs && configs.options) {
            const {
                selectMultiple: multiSelect, defaultDimension: defaultDm, dimensions: dms, selectAll: selcAll,
            } = configs.options;
            // set default values
            if (multiSelect !== undefined) {
                selectMultiple = multiSelect;
            }
            if (dms !== undefined) {
                selectedDimensions = dms.map((dm) => { return dm.toLowerCase(); });
            }
            if (defaultDm !== undefined) {
                defaultDimension = selectedDimensions.includes(defaultDm.toLowerCase()) ? defaultDm.toLowerCase()
                    : selectedDimensions[0];
            }
            if (selcAll !== undefined) {
                selectAll = selcAll;
            }
        }
        const isManager = roleValidationResponse ? roleValidationResponse.isManager : false;
        this.setState({
            selectMultiple, defaultDimension, selectedDimensions, roleValidationResponse: null, isManager, selectAll,
        }, this.loadAPIList);
    }

    /**
     * Publishing the selected options
     * @param {{dm, op}} message : Selected options
     */
    publishSelection(message) {
        super.publish(message);
    }

    /**
     * Registering global parameters in the dashboard
     * @param  {String} dimension the selected dimension
     * @param {String} selection the selected options
     */
    setQueryParam(dimension, selection) {
        super.setGlobalState('dmSelc', {
            dm: dimension,
            op: selection,
        });
    }

    /**
     * Get the selection details from query param
     */
    getqueryParam() {
        return super.getGlobalState('dmSelc');
    }

    /**
     * Load API list
     * @memberof DimensionSelectorWidget
     * */
    loadAPIList() {
        const { isManager, isRoleValidated } = this.state;
        if (isRoleValidated) {
            if (isManager) {
                this.getApiListFromDatabase();
            } else {
                this.getApiListFromPublisher();
            }
        }
    }

    /**
     * Get API list from Publisher
     * @memberof DimensionSelectorWidget
     * */
    getApiListFromPublisher() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.setState({ proxyError: false, apiResponse: response.data });
            })
            .catch((error) => {
                this.setState({ proxyError: true, inProgress: false });
                console.error(error);
            });
    }

    /**
     * Formats the API list retrieved from APIM publisher to remove API uuid
     * @param {object} data - data retrieved
     * @memberof DimensionSelectorWidget
     * */
    formatPublisherApiList(data) {
        const { list } = data;
        let apis = [];

        if (list && list.length > 0) {
            apis = list.map(
                (opt) => { return { name: opt.name, version: opt.version, provider: opt.provider }; },
            );
        }
        this.setState({ apiResponse: null });
        this.handleApiListReceived(apis);
    }


    /**
     * Get API list from AM_DB
     * @memberof DimensionSelectorWidget
     * */
    getApiListFromDatabase() {
        const { widgetID: widgetName, id } = this.props;
        const { providerConfig } = this.state;
        if (providerConfig) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'apiquery';
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleApiDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Handle data received from getApiListFromDatabase
     * @param {object} message - data retrieved
     * @memberof DimensionSelectorWidget
     * */
    handleApiDataReceived(message) {
        const { data } = message;
        let apis = [];

        if (data && data.length > 0) {
            apis = data.map(
                (opt) => { return { name: opt[0], version: opt[1], provider: opt[2] }; },
            );
        }
        this.handleApiListReceived(apis);
    }

    /**
     * Formats API data retrieved
     * @param {object} list - data retrieved
     * @memberof DimensionSelectorWidget
     * */
    handleApiListReceived(list) {
        let {
            options, optionLabel, noOptionsText,
        } = { ...this.state };
        const {
            selectMultiple, defaultDimension, selectedDimensions, isManager, selectAll,
        } = this.state;
        const { dm, op } = this.getqueryParam();

        let dimension;
        if (!dm || !selectedDimensions.includes(dm)) {
            dimension = defaultDimension;
        } else {
            dimension = dm;
        }

        if (dimension === DIMENSION_API) {
            noOptionsText = 'No APIs available';
        } else if (dimension === DIMENSION_PROVIDER) {
            noOptionsText = 'No providers available';
        }

        if (list && list.length > 0) {
            const apis = [...list.sort((a, b) => { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); })];
            if (isManager && selectAll) {
                apis.unshift({ name: 'All', version: 'All', provider: 'All' });
            }

            let providers = [];
            if (selectedDimensions.includes(DIMENSION_PROVIDER)) {
                providers = list.map((dataUnit) => {
                    return dataUnit.provider;
                });
                providers = [...new Set(providers)];
                providers.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });
                if (isManager && selectAll) {
                    providers.unshift('All');
                }
            }

            if (dimension === DIMENSION_API) {
                options = apis;
                optionLabel = option => (option.name === 'All' ? option.name
                    : option.name + ' :: ' + option.version + ' (' + option.provider + ')');
            } else if (dimension === DIMENSION_PROVIDER) {
                options = providers;
                optionLabel = option => option;
            }

            const selectedOptions = this.filterSelectedOption(dimension, options, op, selectMultiple);
            let publishOptions = selectedOptions;
            if (dimension === DIMENSION_PROVIDER) {
                publishOptions = apis.filter(api => selectedOptions.includes(api.provider));
            }
            this.setState({
                dimension,
                apis,
                providers,
                options,
                optionLabel,
                noOptionsText,
                inProgress: false,
                selectedOptions: selectMultiple ? selectedOptions : selectedOptions[0],
            });
            this.setQueryParam(dimension, selectedOptions);
            this.publishSelection({ dm: dimension, op: publishOptions });
        } else {
            this.setState({
                dimension,
                apis: [],
                providers: [],
                options: [],
                optionLabel: option => option,
                noOptionsText,
                selectedOptions: selectMultiple ? [] : null,
                inProgress: false,
            });
            this.setQueryParam(dimension, []);
            this.publishSelection({ dm: dimension, op: [] });
        }
    }


    /**
     * Filter the options selected in query param
     * @param {String} dimension - selected dimension
     * @param {Array} options - available options
     * @param {Array} selection - selected options
     * @param {bool} selectMultiple - multiple selection enabled
     * @memberof DimensionSelectorWidget
     * */
    filterSelectedOption(dimension, options, selection, selectMultiple) {
        if (!selection || selection.length === 0 || !Array.isArray(selection)) {
            return [options[0]];
        }

        const filteredSelection = [];
        if (dimension === DIMENSION_API) {
            if (selection.find(opt => opt.name === 'All')) {
                const allOpt = options.find(opt => opt.name === 'All');
                if (allOpt) {
                    filteredSelection.push(allOpt);
                }
            } else {
                selection.forEach((selc) => {
                    const selcOpt = options.find(opt => opt.name === selc.name && opt.version === selc.version
                        && opt.provider === selc.provider);
                    if (selcOpt) {
                        filteredSelection.push(selcOpt);
                    }
                });
            }
        } else if (dimension === DIMENSION_PROVIDER) {
            if (selection.some(value => value === 'All')) {
                filteredSelection.push('All');
            } else {
                selection.forEach((selc) => {
                    const selcOpt = options.find(opt => opt === selc);
                    if (selcOpt) {
                        filteredSelection.push(selcOpt);
                    }
                });
            }
        }

        if (filteredSelection.length > 0) {
            if (!selectMultiple) {
                return [filteredSelection[0]];
            }
            return filteredSelection;
        } else {
            return [options[0]];
        }
    }

    /**
     * Handle onChange of dimension
     * @param {String} dimension - selected dimension
     * @memberof DimensionSelectorWidget
     * */
    handleChangeDimension(dimension) {
        const { apis, providers, selectMultiple } = this.state;

        let noOptionsText = '';
        let options = [];
        let optionLabel;

        if (dimension === DIMENSION_API) {
            noOptionsText = 'No APIs available';
            options = apis;
            optionLabel = option => (option.name === 'All' ? option.name
                : option.name + ' :: ' + option.version + ' (' + option.provider + ')');
        } else if (dimension === DIMENSION_PROVIDER) {
            noOptionsText = 'No providers available';
            options = providers;
            optionLabel = option => option;
        }

        const selectedOptions = options.length > 0 ? [options[0]] : [];
        let publishOptions = selectedOptions;

        if (dimension === DIMENSION_PROVIDER) {
            publishOptions = apis.filter(api => selectedOptions.includes(api.provider));
        }

        this.setState({
            dimension,
            options,
            optionLabel,
            noOptionsText,
            selectedOptions: selectMultiple ? selectedOptions : selectedOptions[0],
            inProgress: false,
        });
        this.publishSelection({ dm: dimension, op: publishOptions });
        this.setQueryParam(dimension, selectedOptions);
    }

    /**
     * Handle onChange of selected values
     * @param {Array} value - selected options
     * @memberof DimensionSelectorWidget
     * */
    handleChangeSelection(value) {
        const {
            apis, dimension, isManager, selectAll,
        } = this.state;
        const filteredValues = isManager && selectAll ? this.filterSelectionChange(value) : value;
        if (filteredValues.length == 0) {
            return;
        }

        this.setState({ selectedOptions: filteredValues });
        const publishValue = filteredValues === null ? [] : filteredValues;
        this.setQueryParam(dimension, Array.isArray(publishValue) ? publishValue : [publishValue]);

        let publishOptions = [];
        if (dimension === DIMENSION_API) {
            if (Array.isArray(publishValue)) {
                publishOptions = publishValue;
            } else {
                publishOptions = [publishValue];
            }
        } else if (dimension === DIMENSION_PROVIDER) {
            if (Array.isArray(publishValue)) {
                publishOptions = apis.filter(api => publishValue.includes(api.provider));
            } else {
                publishOptions = apis.filter(api => publishValue === api.provider);
            }
        }
        this.publishSelection({ dm: dimension, op: publishOptions });
    }

    /**
     * Filter values based on selection of 'All' option onChange of selected values
     * @param {Array} value - selected options
     * @memberof DimensionSelectorWidget
     * */
    filterSelectionChange(value) {
        const { dimension, selectMultiple } = this.state;
        if (selectMultiple) {
            if (dimension === DIMENSION_API) {
                if (value.length > 0) {
                    if (value[value.length - 1].name === 'All') {
                        return [value[value.length - 1]];
                    }
                    if (value.length === 2) {
                        if (value[0].name === 'All') {
                            return [value[1]];
                        }
                    }
                }
            } else if (dimension === DIMENSION_PROVIDER) {
                if (value.length > 0) {
                    if (value[value.length - 1] === 'All') {
                        return [value[value.length - 1]];
                    }
                    if (value.length === 2) {
                        if (value[0] === 'All') {
                            return [value[1]];
                        }
                    }
                }
            }
        }
        return value;
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the Dimension Selector widget
     * @memberof DimensionSelectorWidget
     */
    render() {
        const {
            messages, faultyProviderConf, options, optionLabel, inProgress, proxyError, noOptionsText, height,
            selectedOptions, dimension, selectMultiple, selectedDimensions,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading, proxyPaper, proxyPaperWrapper, root, search,
            dimensionButton, button, helperText,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;

        if (inProgress) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }

        if (proxyError) {
            return (
                <IntlProvider locale={language} messages={messages}>
                    <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                        <div style={proxyPaperWrapper}>
                            <Paper
                                elevation={1}
                                style={proxyPaper}
                            >
                                <Typography variant='h5' component='h3'>
                                    <FormattedMessage
                                        id='apim.server.error.heading'
                                        defaultMessage='Error!'
                                    />
                                </Typography>
                                <Typography component='p'>
                                    <FormattedMessage
                                        id='apim.server.error'
                                        defaultMessage='Error occurred while retrieving API list.'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    </MuiThemeProvider>
                </IntlProvider>
            );
        }

        return (
            <IntlProvider locale={language} messages={messages}>
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
                                            defaultMessage={'Cannot fetch provider configuration for Dimension '
                                            + 'Selector widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <Scrollbars style={{ height }}>
                                <div style={root}>
                                    <div style={dimensionButton}>
                                        { dimension === DIMENSION_API ? (
                                            <Tooltip title={(
                                                selectedDimensions.includes(DIMENSION_PROVIDER) && (
                                                    <FormattedMessage
                                                        id='dimension.api.tooltip'
                                                        defaultMessage={"Viewing stats by 'API'. Click to change the"
                                                        + " view to 'API Provider'"}
                                                    />
                                                ))}
                                            >
                                                <Button
                                                    style={button}
                                                    variant='outlined'
                                                    fullWidth
                                                    disabled={!selectedDimensions.includes(DIMENSION_PROVIDER)}
                                                    startIcon={<CustomIcon strokeColor={muiTheme.palette.textColor} />}
                                                    onClick={() => this.handleChangeDimension(DIMENSION_PROVIDER)}
                                                >
                                                    <FormattedMessage
                                                        id='dimension.api'
                                                        defaultMessage='API'
                                                    />
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title={(
                                                selectedDimensions.includes(DIMENSION_API) && (
                                                    <FormattedMessage
                                                        id='dimension.provider.tooltip'
                                                        defaultMessage={"Viewing stats by 'API Provider'. Click to"
                                                        + " change the view to 'API'."}
                                                    />
                                                ))}
                                            >
                                                <Button
                                                    style={button}
                                                    variant='outlined'
                                                    fullWidth
                                                    disabled={!selectedDimensions.includes(DIMENSION_API)}
                                                    startIcon={<PersonIcon />}
                                                    onClick={() => this.handleChangeDimension(DIMENSION_API)}
                                                >
                                                    <FormattedMessage
                                                        id='dimension.provider'
                                                        defaultMessage='API Provider'
                                                    />
                                                </Button>
                                            </Tooltip>
                                        )
                                        }
                                    </div>
                                    <div style={search}>
                                        <Tooltip title={dimension === DIMENSION_API ? (
                                            <FormattedMessage
                                                id='search.tooltip.api'
                                                defaultMessage='Select API(s) to view stats'
                                            />
                                        ) : (
                                            <FormattedMessage
                                                id='search.tooltip.provider'
                                                defaultMessage='Select API Provider(s) to view stats'
                                            />
                                        )}
                                        >
                                            <Autocomplete
                                                multiple={selectMultiple}
                                                filterSelectedOptions
                                                id='tags-standard'
                                                ListboxProps={{ style: { maxHeight: 400, overflow: 'auto' } }}
                                                options={options}
                                                getOptionLabel={optionLabel}
                                                renderInput={params => (
                                                    <TextField
                                                        {...params}
                                                        variant='outlined'
                                                        fullWidth
                                                    />
                                                )}
                                                value={selectedOptions}
                                                onChange={(event, value) => this.handleChangeSelection(value)}
                                                noOptionsText={noOptionsText}
                                                loadingText={(
                                                    <FormattedMessage
                                                        id='search.loading'
                                                        defaultMessage='Loading options...'
                                                    />
                                                )}
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                                {
                                    dimension === 'api' && (
                                        <Typography variant='caption' style={helperText}>
                                            <FormattedMessage
                                                id='dimension.api.helper'
                                                defaultMessage={'APIs are listed in the format \'api_name'
                                                + ' :: api_version (api_provider)\''}
                                            />
                                        </Typography>
                                    )
                                }
                            </Scrollbars>
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('DimensionSelector', DimensionSelectorWidget);
