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
import Axios from 'axios';
import Widget from '@wso2-dashboards/widget';
import { Scrollbars } from 'react-custom-scrollbars';
import FormControl from '@material-ui/core/FormControl';
import {
    defineMessages, IntlProvider, addLocaleData, FormattedMessage,
} from 'react-intl';
import { createMuiTheme, MuiThemeProvider, Button } from '@material-ui/core';
import DateWidget from './DateWidget';
import PDFView from './PDFView';

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

const styles = {
    headingWrapper: {
        margin: 'auto',
        width: '95%',
    },
    formWrapper: {
        marginBottom: '5%',
    },
    form: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    formControl: {
        marginLeft: '2%',
        marginTop: '2%',
        minWidth: 120,
    },
};

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
 *
 */
class APIMApiUsageSummaryWidget extends Widget {
    /**
     * Creates an instance of APIMApiAvailabilityWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMApiAvailabilityWidget
     */
    constructor(props) {
        super(props);

        this.state = {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
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

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMApiAvailabilityWidget
     * @returns {Promise}
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMApiUsageSummary/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    // eslint-disable-next-line require-jsdoc
    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    setMonth(month) {
        this.setState({
            month,
        });
    }

    setYear(year) {
        this.setState({
            year,
        });
    }

    onDocumentComplete(pages) {
        this.setState({ page: 1, pages });
    }

    render() {
        const {
            localeMessages,
        } = this.state;
        const { muiTheme, height } = this.props;
        const themeName = muiTheme.name;
        const pdfBaseUrl = `${window.contextPath}/apis/v1.0/report`;
        const monthInt = this.state.month + 1; // Date is 0 based in the widget
        const monthString = (monthInt < 10) ? '0' + monthInt : monthInt; // prefix by 0;

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    <Scrollbars style={{ height }}>
                        <div style={{
                            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                            height,
                            margin: '10px',
                            padding: '20px',
                        }}
                        >
                            <div style={styles.headingWrapper}>
                                <h3 style={{
                                    borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                                    paddingBottom: '10px',
                                    margin: 'auto',
                                    marginTop: 0,
                                    textAlign: 'left',
                                    fontWeight: 'normal',
                                    letterSpacing: 1.5,
                                }}
                                >
                                    <FormattedMessage id='widget.heading' defaultMessage='APIM ADMIN REPORTS' />
                                </h3>

                                <form
                                    style={styles.form}
                                    noValidate
                                    autoComplete='off'
                                    method='get'
                                    target='_blank'
                                    action={pdfBaseUrl}
                                >
                                    <input type='hidden' name='year' value={this.state.year} />
                                    <input type='hidden' name='month' value={monthString} />
                                    <DateWidget
                                        year={this.state.year}
                                        month={this.state.month}
                                        setMonth={year => this.setMonth(year)}
                                        setYear={year => this.setYear(year)}
                                    />
                                    <FormControl style={styles.formControl}>
                                        <Button
                                            size='small'
                                            variant='outlined'
                                            type='submit'
                                            style={{ bottom: 0, position: 'absolute' }}
                                        >
                                            <FormattedMessage id='download' defaultMessage='Download' />
                                        </Button>
                                    </FormControl>
                                </form>
                                <br />
                                <div>
                                    <PDFView
                                        src={`${pdfBaseUrl}?year=${this.state.year}&month=${monthString}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </Scrollbars>
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMApiUsageSummary', APIMApiUsageSummaryWidget);
