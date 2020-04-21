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
import CustomIcon from './CustomIcon';

const DIMENSION_API = 'api';
const DIMENSION_PROVIDER = 'provider';

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
 * Create React Component for APIM Api Created
 * @class APIMDimensionSelectorWidget
 * @extends {Widget}
 */
class APIMDimensionSelectorWidget extends Widget {
    /**
     * Creates an instance of APIMDimensionSelectorWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMDimensionSelectorWidget
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
            refreshInterval: 60000, // 1min
            refreshIntervalId: null,
            inProgress: true,
            proxyError: false,
            selectedOptions: [],
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
                padding: '10px',
                paddingTop: '20px',
                margin: 'auto',
                display: 'flex',
                // flexWrap: 'wrap',
                width: '95%',
            },
            search: {
                paddingLeft: '20px',
                width: '100%',
                margin: 'auto',
            },
            dimensionButton: {
                height: '100%',
                width: '15%',
                margin: 'auto',
                padding: '10px',
            },
            button: {
                minHeight: '55px',
                minWidth: '120px',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }
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
     * Load locale file.
     * @memberof APIMDimensionSelectorWidget
     * @param {String} locale - locale
     * @returns {Promise}
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiFaultsSummary/locales/${locale}.json`)
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
     *
     * @param {any} props @inheritDoc
     */
    componentDidMount() {
        this.assembleApiListQuery();
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
     * Publishing the selected options
     * @param {{dm, op: *}} message : Selected options
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
     * Get API list from Publisher
     * @memberof APIMDimensionSelectorWidget
     * */
    assembleApiListQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/apis`)
            .then((response) => {
                this.setState({ proxyError: false });
                this.handleApiListReceived(response.data);
            })
            .catch((error) => {
                this.setState({ proxyError: true, inProgress: false });
                console.error(error);
            });
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} data - data retrieved
     * @memberof APIMDimensionSelectorWidget
     * */
    handleApiListReceived(data) {
        let {
            options, optionLabel, dimension, noOptionsText,
        } = { ...this.state };
        const { dm, op } = this.getqueryParam();
        const { list } = data;

        if (!dm || ![DIMENSION_API, DIMENSION_PROVIDER].includes(dm)) {
            dimension = DIMENSION_API;
        } else {
            dimension = dm;
        }

        if (dimension === DIMENSION_API) {
            noOptionsText = 'No APIs available';
        } else if (dimension === DIMENSION_PROVIDER) {
            noOptionsText = 'No providers available';
        }

        if (list && list.length > 0) {
            const apis = list.sort((a, b) => { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
            let providers = list.map((dataUnit) => {
                return dataUnit.provider;
            });
            providers = [...new Set(providers)];
            providers.sort((a, b) => { return a.toLowerCase().localeCompare(b.toLowerCase()); });

            if (dimension === DIMENSION_API) {
                options = apis;
                optionLabel = option => option.name + ' :: ' + option.version + ' (' + option.provider + ')';
            } else if (dimension === DIMENSION_PROVIDER) {
                options = providers;
                optionLabel = option => option;
            }

            const selectedOptions = this.filterSelectedOption(dimension, options, op);
            this.setState({
                dimension,
                apis,
                providers,
                options,
                optionLabel,
                noOptionsText,
                inProgress: false,
                selectedOptions,
            });
            this.setQueryParam(dimension, selectedOptions);
            this.publishSelection({ dm: dimension, op: selectedOptions });
        } else {
            this.setState({
                dimension,
                apis: [],
                providers: [],
                options: [],
                optionLabel: option => option,
                noOptionsText,
                selectedOptions: [],
                inProgress: false,
            });
            this.setQueryParam(dimension, []);
            this.publishSelection({ dm: dimension, op: selectedOptions });
        }
    }

    filterSelectedOption(dimension, options, selection) {
        if (!selection || selection.length === 0) {
            return [options[0]];
        }

        const filteredSelection = [];
        if (dimension === DIMENSION_API) {
            selection.forEach((selc) => {
                const selcOpt = options.find(opt => opt.name === selc.name && opt.version === selc.version
                    && opt.provider === selc.provider);
                if (selcOpt) {
                    filteredSelection.push(selcOpt);
                }
            });
        } else if (dimension === DIMENSION_PROVIDER) {
            selection.forEach((selc) => {
                const selcOpt = options.find(opt => opt === selc);
                if (selcOpt) {
                    filteredSelection.push(selcOpt);
                }
            });
        }

        if (filteredSelection.length > 0) {
            return filteredSelection;
        } else {
            return [options[0]];
        }
    }

    handleChangeDimension(dimension) {
        const { apis, providers } = this.state;

        let noOptionsText = '';
        let options = [];
        let optionLabel;

        if (dimension === DIMENSION_API) {
            noOptionsText = 'No APIs available';
            options = apis;
            optionLabel = option => option.name + ' :: ' + option.version + ' (' + option.provider + ')';
        } else if (dimension === DIMENSION_PROVIDER) {
            noOptionsText = 'No providers available';
            options = providers;
            optionLabel = option => option;
        }

        const selectedOptions = options.length > 0 ? [options[0]] : [];

        this.setState({
            dimension,
            options,
            optionLabel,
            noOptionsText,
            selectedOptions,
            inProgress: false,
        });
        this.publishSelection({ dm: dimension, op: selectedOptions });
        this.setQueryParam(dimension, selectedOptions);
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Api Created widget
     * @memberof APIMDimensionSelectorWidget
     */
    render() {
        const {
            messages, faultyProviderConf, options, optionLabel, inProgress, proxyError, noOptionsText,
            selectedOptions, dimension,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading, proxyPaper, proxyPaperWrapper, root, search,
            dimensionButton, button,
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
                                            defaultMessage={'Cannot fetch provider configuration for APIM Dimension '
                                            + 'Selector widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <div style={root}>
                                <div style={dimensionButton}>
                                    { dimension === DIMENSION_API ? (
                                        <Tooltip title={(
                                            <FormattedMessage
                                                id='dimension.api.tooltip'
                                                defaultMessage={"Viewing stats by 'API'. "
                                                + "Click to change the view to 'API Provider'."}
                                            />
                                        )}
                                        >
                                            <Button
                                                style={button}
                                                variant='outlined'
                                                fullWidth
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
                                            <FormattedMessage
                                                id='dimension.provider.tooltip'
                                                defaultMessage={"Viewing stats by 'API Provider'. "
                                                + "Click to change the view to 'API'."}
                                            />
                                        )}
                                        >
                                            <Button
                                                style={button}
                                                variant='outlined'
                                                fullWidth
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
                                            multiple
                                            filterSelectedOptions
                                            id='tags-standard'
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
                                            onChange={(event, value) => {
                                                this.setState({ selectedOptions: value });
                                                this.setQueryParam(dimension, value);
                                                this.publishSelection({ dm: dimension, op: value });
                                            }}
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
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMDimensionSelector', APIMDimensionSelectorWidget);
