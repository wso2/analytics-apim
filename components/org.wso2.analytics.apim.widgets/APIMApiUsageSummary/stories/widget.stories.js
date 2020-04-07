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
        getWidgetChannelManager={() => {
            return {
                unsubscribeWidget: () => { return Promise.resolve(''); },
            };
        }}
    />
);

export const lightTheme = () => (
    <MuiThemeProvider>
        <APIMApiUsageSummaryWidget
            muiTheme={{ name: 'light' }}
            getWidgetChannelManager={() => {
                return {
                    unsubscribeWidget: () => { return Promise.resolve(''); },
                };
            }}
        />
    </MuiThemeProvider>
);
