/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CustomTable from './CustomTable';
import ApiAvailability from './ApiAvailability';

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
 * React Component for Overall Api Stats widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Overall Api Stats widget body
 */
export default function APIMOverallApiStats(props) {
    const {
        themeName, height, availableApiData, legendData, topApiNameData,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '90%',
        },
    };
    const availabilityProps = { availableApiData, legendData };

    return (
        <MuiThemeProvider
            theme={themeName === 'dark' ? darkTheme : lightTheme}
        >
            <Scrollbars
                style={{ height }}
            >
                <div style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    width: '80%',
                    margin: '5% auto',
                    padding: '10% 5%',
                }}
                >
                    <div style={styles.headingWrapper}>
                        <h3 style={{
                            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                            paddingBottom: '10px',
                            margin: 'auto',
                            textAlign: 'left',
                            fontWeight: 'normal',
                            letterSpacing: 1.5,
                        }}
                        >
                            <FormattedMessage id='widget.heading' defaultMessage='OVERALL API STATS' />
                        </h3>
                    </div>
                    <div>
                        <div style={{
                            marginTop: '10%',
                            marginBottom: '10%',
                            background: themeName === 'dark' ? '#162638' : '#f7f7f7',
                            padding: '5%',
                        }}
                        >
                            <ApiAvailability {...availabilityProps} />
                        </div>
                        <CustomTable data={topApiNameData} />
                    </div>
                </div>
            </Scrollbars>
        </MuiThemeProvider>
    );
}

APIMOverallApiStats.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    availableApiData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    topApiNameData: PropTypes.instanceOf(Object).isRequired,
};
