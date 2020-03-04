import React from 'react';
import Widget from '@wso2-dashboards/widget';
import Button from '@material-ui/core/Button';
import cloneDeep from 'lodash/cloneDeep';
import TextField from '@material-ui/core/TextField';
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
            localeMessages: null,
            currentMessage: '',
            publishedMessages: [],
        };

        this.styles = {
            // Insert styles Here
            mainDiv: {
                backgroundColor: '#0e1e33',                
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
            textField: {
                width: '100%',
                paddingRight: 10,
                paddingLeft: 10,
                marginTop: 50,
                marginBottom: 50,
            },
            button: {
                marginLeft: 10,
            },
            outputText: {
                paddingLeft: 15,
                marginTop: 10,
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.publishMsg = this.publishMsg.bind(this);
        this.onChangeHandle = this.onChangeHandle.bind(this);
        this.getPublishedMsgsOutput = this.getPublishedMsgsOutput.bind(this);
        this.clearMsgs = this.clearMsgs.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.handleQueryResults = this.handleQueryResults.bind(this);
        this.input = {};
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
        // Use this method to load default values to publisher parameters
        super.publish('Initial Message');
        const { widgetID } = this.props;
        //This function retrieves the provider configuration defined in the widgetConf.json file and make it available to be used inside the widget
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
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
        // Use this method to subscribe to the endpoint via web socket connection
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
        // Insert the code to handle the data received through query
        if (data.length !== 0) {
            this.setState({ currentMessage: data[0] });
        } else {
            this.setState({ currentMessage: 'No alerts!' });
        }
    }

    /**
     * Publishing the parameters for the subscriber widgets
     * @memberof <%= className %>
     */
    publishMsg() {
        const { currentMessage } = this.state;
        if (currentMessage && (currentMessage.length > 0)) {
            // Use this method to publish the message to the dashboard portal
            super.publish(currentMessage);
            const newPublishedMessages = this.state.publishedMessages;
            newPublishedMessages.push({ time: new Date(), value: currentMessage });
            this.setState({ publishedMessages: newPublishedMessages });
        }
    }

    /**
     * Publishing the parameters for the subscriber widgets
     * @memberof <%= className %>
     * @returns {string}
     */
    getPublishedMsgsOutput() {
        const messages = this.state.publishedMessages;
        if (messages.length > 0) {
            return messages.map((message) => {
                return (
                    <div>
                        [Sent]
                        {' '}
                        {message.time.toTimeString()}
                        {' '}
                        [Message] -
                        {' '}
                        {message.value}
                    </div>
                );
            });
        } else {
            return <div>No messages!</div>;
        }
    }

    /**
     * Clear the displayed messages
     * @memberof <%= className %>
     */
    clearMsgs() {
        this.setState({ publishedMessages: [] });
        this.publishedMsgSet = [];
    }

    /**
     * Set the user input value
     * @memberof <%= className %>
     * @param {string} value User input value
     */
    onChangeHandle(value) {
        this.setState({ inputVal: value });
        this.input = {};
        this.input.value = value;
    }

    /**
     * @returns {ReactElement} Render the <%= className %>
     * @memberof <%= className %>
     */
    render() {
        const { localeMessages } = this.state;
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
                                <div style={this.styles.textField}>
                                    <h5>
                                        API Alerts Within Last Week
                                    </h5>
                                </div>
                                <div style={this.styles.textField}>
                                    <TextField
                                        hintText='Hint Text'
                                        fullWidth
                                        value={this.state.currentMessage}
                                        onChange={event => this.setState({ currentMessage: event.target.value })}
                                    />
                                </div>
                                <div style={this.styles.button}>
                                    <Button
                                        variant='contained'
                                        color='primary'
                                        onClick={this.publishMsg}
                                    >
                                      Publish
                                    </Button>
                                    <Button
                                        variant='contained'
                                        color='primary'
                                        onClick={this.clearMsgs}
                                        style={this.styles.button}
                                    >
                                      Clear
                                    </Button>
                                </div>
                                <div style={this.styles.outputText}>
                                    {this.getPublishedMsgsOutput()}
                                </div>
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
