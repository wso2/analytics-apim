/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { action } from '@storybook/addon-actions';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import APIMApiUsageSummaryWidget from '../src/APIMApiUsageSummaryWidget';

export default {
    component: APIMApiUsageSummaryWidget,
    title: 'APIMApiUsageSummaryWidget',
};

export const darkTheme = () => (
    <APIMApiUsageSummaryWidget
        muiTheme={{ name: 'dark' }}
        widgetConf={{
            configs: {
                pubsub: {
                    types: ['subscriber'],
                },
                providerConfig: {
                    configs: {
                        config: {
                            siddhiApp: '',
                            queryData: {
                                query: '',
                            },
                            publishingInterval: 360000,
                        },
                    },
                },
            },
        }}
        getWidgetChannelManager={() => {
            return {
                unsubscribeWidget: () => { return Promise.resolve(''); },
                subscribeWidget: () => {
                    return Promise.resolve(null);
                },
            };
        }}
    />
);

export const lightTheme = () => (
    <MuiThemeProvider>
        <APIMApiUsageSummaryWidget
            muiTheme={{ name: 'light' }}
            widgetConf={{
                configs: {
                    pubsub: {
                        types: ['subscriber'],
                    },
                    providerConfig: {
                        configs: {
                            config: {
                                siddhiApp: '',
                                queryData: {
                                    query: '',
                                },
                                publishingInterval: 360000,
                            },
                        },
                    },
                },
            }}
            getWidgetChannelManager={() => {
                return {
                    unsubscribeWidget: () => { return Promise.resolve(''); },
                    subscribeWidget: () => {
                        return Promise.resolve(null);
                    },
                };
            }}
        />
    </MuiThemeProvider>
);
