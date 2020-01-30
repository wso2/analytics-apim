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
import ApiInfoChart from './ApiInfoChart';

/**
 * Display API Overall Info
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Overall info widget body
 */
export default function APIMOverallApiInfo(props) {
    const {
        height, usageData, totalcount, inProgress, themeName,
    } = props;
    const styles = {
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '75%',
            padding: '4%',
            border: '1.5px solid',
            marginLeft: '8%',
            marginTop: '5%',
        },
        appBarColour: {
            backgroundColor: themeName === 'dark' ? '#27296b' : '#E8E8E8',
        },
        headingWrapper: {
            margin: 'auto',
            width: '95%',
            marginBottom: '10px',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '10px',
            margin: 'auto',
            marginTop: '10px',
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        mainDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            height,
            margin: '10px',
            padding: '20px',
        },
    };

    return (
        <div style={styles.mainDiv}>
            <Scrollbars style={{ height }}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='api.info.heading'
                            defaultMessage='OVERALL API STATS'
                        />
                    </h3>
                </div>
                { inProgress ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        { usageData.length > 0 ? (
                            <div>
                                <ApiInfoChart
                                    usageData={usageData}
                                    totalcount={totalcount}
                                    themeName={themeName}
                                />
                            </div>
                        ) : (
                            <div style={styles.paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={styles.paper}
                                >
                                    <Typography
                                        variant='h5'
                                        component='h3'
                                    >
                                        <FormattedMessage
                                            id='nodata.error.heading'
                                            defaultMessage='No Data Available !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='nodata.error.body'
                                            defaultMessage='No data available for the selected options.'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        )}
                    </div>
                )}
            </Scrollbars>
        </div>
    );
}

APIMOverallApiInfo.propTypes = {
    height: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    totalcount: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
    themeName: PropTypes.string.isRequired,
};
