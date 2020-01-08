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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TrafficChart from './TrafficChart';

/**
 * React Component for Recent Api Traffic widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Recent Api Traffic widget body
 */
export default function APIMRecentApiTraffic(props) {
    const {
        themeName, usageData,
    } = props;
    const styles = {
        headingWrapper: {
            height: '5%',
            margin: 'auto',
            paddingTop: '10px',
            width: '90%',
        },
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: '#969696',
            width: '75%',
            padding: '4%',
            border: '1.5px solid #fff',
            margin: 'auto',
            marginTop: '5%',
        },
        selectEmpty: {
            marginTop: 10,
        },
    };

    if (usageData.length === 0) {
        return (
            <div style={styles.paperWrapper}>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography variant='h5' component='h3'>
                        <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    }
    return (
        <div
            style={{
                background: themeName === 'light' ? '#fff' : '#162638',
                width: 'auto',
                height: 'auto',
                margin: '3% 3%',
            }}
        >
            <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '1px solid #02212f',
                    paddingBottom: '5px',
                    margin: 'auto',
                    textAlign: 'center',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                }}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='Recent Api Traffic' />

                </h3>
            </div>

            <div style={styles.dataWrapper}>
                <TrafficChart
                    data={usageData}
                />
            </div>

        </div>

    );
}

APIMRecentApiTraffic.propTypes = {
    themeName: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
};
