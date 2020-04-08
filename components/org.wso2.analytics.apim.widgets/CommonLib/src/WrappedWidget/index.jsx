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
import PropTypes from 'prop-types';
import Axios from 'axios';
import {
    defineMessages,
    addLocaleData,
    IntlProvider,
} from 'react-intl';

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
 * @param {React.Component} WrappedComponent Component to wrap
 * @param {String} componentName Name of the component to Wrap
 * @returns {React.Component} withWrappedWidget Component
 */
export default function withWrappedWidget(WrappedComponent, componentName) {
    const component = class WrappedWidget extends Widget {
        /**
         * @inheritdoc
         */
        constructor(props) {
            super(props);
            const { width, height, glContainer } = this.props;
            this.state = {
                width,
                height,
                messages: null,
                faultyProviderConfig: false,
                widgetConf: null,
            };
            // This will re-size the widget when the glContainer's width is changed.
            if (glContainer !== undefined) {
                glContainer.on('resize', () => this.setState({
                    width: glContainer.width,
                    height: glContainer.height,
                }));
            }
        }

        /**
         *
         * @param {any} props @inheritDoc
         */
        componentDidMount() {
            const {
                widgetID,
            } = this.props;
            const locale = (languageWithoutRegionCode || language || 'en');
            this.loadLocale(locale).catch(() => {
                this.loadLocale().catch(() => {
                    // TODO: Show error message.
                });
            });

            this.setState({
                inProgress: true,
            });

            super.getWidgetConfiguration(widgetID).then((message) => {
                this.setState({
                    faultyProviderConfig: false,
                    inProgress: false,
                    widgetConf: message.data,
                });
            }).catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                    inProgress: false,
                });
            });
        }


        /**
         * Load locale file.
         * @param {String} locale - locale
         * @returns {Promise}
         */
        loadLocale(locale = 'en') {
            return Axios
                .get(`${window.contextPath}/public/extensions/widgets/${componentName}/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ messages: defineMessages(response.data) });
                });
        }

        /**
         * @inheritDoc
         * @returns {ReactElement}
         * @memberof WrappedWidget
         */
        render() {
            const {
                messages, width, height, widgetConf, faultyProviderConfig,
            } = this.state;
            return (
                <IntlProvider locale={language} messages={messages}>
                    <WrappedComponent
                        {...this.props}
                        width={width}
                        height={height}
                        getWidgetChannelManager={(...args) => super.getWidgetChannelManager(...args)}
                        widgetConf={widgetConf}
                        faultyProviderConfig={faultyProviderConfig}
                    />
                </IntlProvider>
            );
        }
    };
    component.propTypes = {
        height: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        glContainer: PropTypes.instanceOf(Object).isRequired,
        widgetID: PropTypes.string.isRequired,
    };
    component.defaultProps = {

    };
    if (global.dashboard) {
        global.dashboard.registerWidget(componentName, component);
    }
    return component;
}
