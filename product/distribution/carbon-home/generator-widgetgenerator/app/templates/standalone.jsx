import React from 'react';
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';

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
 * Create React Component for <%= widgetId %>
 * @class <%= className %>
 * @extends {Widget}
 */
class <%= className %> extends Widget {
    /**
     * Creates an instance of <%= className %>.
     * @param {any} props @inheritDoc
     * @memberof <%= className %>
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            alertCount: 0,
            messages: null,
            refreshInterval: 60000, // 1min
            refreshIntervalId: null,
            localeMessages: null,
        };

        this.styles = {
            // insert styles here
            mainDiv: {
                backgroundColor: '#0e1e33',
                margin: '10px',
                padding: '20px',
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
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleQueryResults = this.handleQueryResults.bind(this);
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
        const { widgetID, id } = this.props;
        const { refreshInterval } = this.state;
        // This method is mandatory and used to load the providerConfig of widgetConf.json file.
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                // set an interval to periodically retrieve data
                const refresh = () => {
                    super.getWidgetChannelManager().unsubscribeWidget(id);
                    this.assembleQuery();
                };
                const refreshIntervalId = setInterval(refresh, refreshInterval);
                this.setState({
                    refreshIntervalId,
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.assembleQuery()));
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
        const { refreshIntervalId } = this.state;
        clearInterval(refreshIntervalId);
        this.setState({
            refreshIntervalId: null,
        });
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof <%= className %>
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/<%= widgetId %>/locales/${locale}.json`)
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
     * Formats the query using selected options
     * @memberof <%= className %>
     * */
    assembleQuery() {
        const { providerConfig } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'alertQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{weekStart}}': (Date.now() - 604800),
            '{{weekEnd}}': Date.now(),
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    }

    /**
     * Formats data retrieved
     * @param {object} message - data retrieved
     * @memberof <%= className %>
     * */
    handleQueryResults(message) {
        const { data } = message;
        // Insert the code to handle the data recived through query
        if (data.length !== 0) {
            this.setState({ alertCount: data[0] });
        } else {
            this.setState({ alertCount: 'No alerts!' });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the <%= className %>
     * @memberof <%= className %>
     */
    render() {
        const { localeMessages, alertCount } = this.state;
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
                    <div style={this.styles.mainDiv}>
                        <div style={this.styles.headingWrapper}>
                            <h3 style={this.styles.h3}>
                                <FormattedMessage
                                    id='widget.heading'
                                    defaultMessage='SAMPLE HEADING'
                                />
                            </h3>
                            <div style={this.styles.dataWrapper}>
                                <h4 style={this.styles.title}>
                                    API Alerts Within Last Week
                                </h4>
                                <h2 style={this.styles.content}>
                                    {alertCount}
                                </h2>
                            </div>
                        </div>
                    </div>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('<%= widgetId %>', <%= className %>);
