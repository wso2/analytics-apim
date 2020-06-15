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
import { Scrollbars } from 'react-custom-scrollbars';
import { FormattedMessage } from 'react-intl';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import CustomTable from './CustomTable';

/**
 * Display API Overall Info
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Overall info widget body
 */
export default function APIMOverallApiInfo(props) {
    const {
        height, apiInfoData, inProgress, themeName,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            marginTop: 0,
        },
        dataWrapper: {
            height: '75%',
            paddingTop: 35,
            margin: 'auto',
            width: '90%',
        },
        paperWrapper: {
            height: '75%',
            width: '95%',
            margin: 'auto',
        },
        paper: {
            background: themeName === 'dark' ? '#152638' : '#E8E8E8',
            padding: '4%',
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
        subheading: {
            textAlign: 'center',
            margin: 5,
            fontSize: 14,
            color: '#b5b5b5',
        },
    };

    return (
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
            >
                <div style={styles.headingWrapper}>
                    <h3 style={styles.heading} >
                        <FormattedMessage id='api.info.heading' defaultMessage='OVERALL API INFO' />
                    </h3>
                    <p style={styles.subheading}>
                        <FormattedMessage id='api.info.subheading' defaultMessage='(Last 24 Hours)' />
                    </p>
                </div>
                <div>
                    { inProgress ? (
                        <div style={styles.loading}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    ) : (
                        <div>
                            { apiInfoData.length === 0
                                ? (
                                    <div style={styles.dataWrapper}>
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
                                                    defaultMessage={'No matching data available for the '
                                                    + 'selected options.'}
                                                />
                                            </Typography>
                                        </Paper>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ marginTop: '2%' }}>
                                            <CustomTable data={apiInfoData} loadingApiInfo={inProgress} />
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )}
                </div>
            </div>
        </Scrollbars>
    );
}

APIMOverallApiInfo.propTypes = {
    height: PropTypes.string.isRequired,
    apiInfoData: PropTypes.instanceOf(Object).isRequired,
    loadingApiInfo: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
    themeName: PropTypes.string.isRequired,
};
