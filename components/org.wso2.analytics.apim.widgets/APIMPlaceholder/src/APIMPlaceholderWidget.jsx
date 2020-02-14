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
import Widget from '@wso2-dashboards/widget';
import { Scrollbars } from 'react-custom-scrollbars';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';

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
 *
 */
class APIMPlaceholderWidget extends Widget {
    render() {
        const { muiTheme, height } = this.props;
        const themeName = muiTheme.name;

        return (
            <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                <Scrollbars style={{
                    height,
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                }}
                >
                    <div style={{
                        backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                        margin: '10px',
                        padding: '20px',
                    }}
                    />
                </Scrollbars>
            </MuiThemeProvider>
        );
    }
}

global.dashboard.registerWidget('APIMPlaceholder', APIMPlaceholderWidget);
