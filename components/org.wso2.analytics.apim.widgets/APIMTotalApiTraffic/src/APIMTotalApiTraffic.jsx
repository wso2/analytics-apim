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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import TrafficChart from './TrafficChart';

/**
 * React Component for Total Api Traffic widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Total Api Traffic widget body
 */
export default function APIMTotalApiTraffic(props) {
    const {
        themeName, usageData, handleLimitChange, limit, height, inProgress, setCurrentApi
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        paperWrapper: {
            height: '75%',
            width: '95%',
            margin: 'auto',
        },
        paper: {
            background: themeName === 'dark' ? '#152638' : '#E8E8E8',
            marginTop: 10,
            padding: '4%',
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        formControl: {
            marginTop: '2%',
            marginLeft: '5%',
        },
        mainDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            height,
            padding: 30,
        },
        h3: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };

    return (
        <Scrollbars style={{ height }}>
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='widget.heading'
                            defaultMessage='TOTAL API TRAFFIC'
                        />
                    </h3>
                </div>
                { inProgress ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        { usageData.length !== 0 ? (
                            <div>
                                <FormControl style={styles.formControl}>
                                    <Tooltip
                                        placement='top'
                                        title={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                                    >
                                        <InputLabel
                                            shrink
                                            htmlFor='limit-number'
                                            style={styles.formLabel}
                                        >
                                            <FormattedMessage
                                                id='limit'
                                                defaultMessage='Limit :'
                                            />
                                        </InputLabel>
                                    </Tooltip>
                                    <Input
                                        id='limit-number'
                                        value={limit}
                                        onChange={handleLimitChange}
                                        type='number'
                                        margin='normal'
                                    />
                                </FormControl>
                                <div style={styles.dataWrapper}>
                                    <TrafficChart
                                        data={usageData}
                                        themeName={themeName}
                                        setCurrentApi={setCurrentApi}
                                    />
                                </div>
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
                                            defaultMessage='No data available for the selected options!.'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMTotalApiTraffic.propTypes = {
    themeName: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    limit: PropTypes.string.isRequired,
    inProgress: PropTypes.bool.isRequired,
    height: PropTypes.number.isRequired,
};
