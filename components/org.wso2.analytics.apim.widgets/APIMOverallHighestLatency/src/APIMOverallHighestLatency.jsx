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
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { green } from '@material-ui/core/colors';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

/**
 * React Component for APIM Overall Highest Latency widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Highest Latency widget body
 */
export default function APIMOverallHighestLatency(props) {
    const {
        themeName, apiName, apiVersion, highestLatency, inProgress, height, handleOnClick,
    } = props;
    const styles = {
        root: {
            backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
            height: '100%',
            cursor: 'pointer',
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        headingWrapper: {
            margin: 'auto',
            paddingTop: 30,
        },
        subheading: {
            textAlign: 'center',
            margin: 5,
            fontSize: 14,
            color: '#b5b5b5',
        },
        dataWrapper: {
            margin: 'auto',
            textAlign: 'center',
            fontSize: '150%',
            fontWeight: 500,
            color: themeName === 'dark' ? '#fff' : '#2571a7',
            paddingTop: 10,
            marginTop: '10%',
        },
        paperWrapper: {
            height: '75%',
            width: '95%',
            margin: 'auto',
            paddingTop: 35,
        },
        paper: {
            background: themeName === 'dark' ? '#152638' : '#E8E8E8',
            padding: '4%',
        },
        latencyUnit: {
            fontSize: 20,
            color: green[500],
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        loading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
    };

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
            style={styles.root}
            className={`overview-wrapper ${themeName}`}
            onClick={() => handleOnClick()}
        >
            <div style={styles.headingWrapper}>
                <h3
                    style={styles.heading}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='OVERALL HIGHEST LATENCY' />
                </h3>
                <p style={styles.subheading}>
                    <FormattedMessage id='api.info.subheading' defaultMessage='(Last 24 Hours)' />
                </p>
            </div>
            <div>
                {inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        {highestLatency === 0 ? (
                            <div style={styles.paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={styles.paper}
                                >
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='nodata.error.heading'
                                            defaultMessage='No Data Available !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='nodata.error.body'
                                            defaultMessage='No data available for the selected options'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <div style={styles.dataWrapper}>
                                <div>
                                    {apiName}
                                    {' ( '}
                                    {apiVersion}
                                    {' )'}
                                </div>
                                <div style={{ fontSize: '200%' }}>
                                    {highestLatency}
                                    <span style={styles.latencyUnit}>
                                        {' '}
                                        <FormattedMessage id='latency.unit' defaultMessage='MS' />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

APIMOverallHighestLatency.propTypes = {
    themeName: PropTypes.string.isRequired,
    apiName: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    highestLatency: PropTypes.number.isRequired,
    height: PropTypes.string.isRequired,
    inProgress: PropTypes.bool.isRequired,
    handleOnClick: PropTypes.func.isRequired,
};
