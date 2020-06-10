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
import Autocomplete from '@material-ui/lab/Autocomplete';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import CustomTable from './CustomTable';

/**
 * Display API Alert Summary
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Alert Summary widget body
 */
export default function APIMAlertSummary(props) {
    const {
        height, alertData, inProgress, themeName, selectedApi, apiList, handleApiChange, limit, handleLimitChange,
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
            paddingBottom: '10px',
            marginTop: 0,
        },
        dataWrapper: {
            height: '75%',
            paddingTop: 35,
            margin: 'auto',
            width: '90%',
        },
        tableWrapper: {
            paddingTop: 5,
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
        formWrapper: {
            paddingBottom: 20,
            paddingLeft: 20,
        },
        formControlAutocomplete: {
            marginRight: 20,
            marginTop: 15,
            minWidth: 300,
        },
        formControlLimit: {
            width: '10%',
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
                    <h3 style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='ALERT SUMMARY' />
                    </h3>
                </div>

                <div style={styles.formWrapper}>
                    <form noValidate autoComplete='off'>
                        <FormControl style={styles.formControlAutocomplete}>
                            <Autocomplete
                                options={apiList}
                                getOptionLabel={option => option}
                                value={selectedApi}
                                onChange={(event, value) => handleApiChange(value)}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label={<FormattedMessage id='api.label' defaultMessage='API' />}
                                        variant='standard'
                                    />
                                )}
                            />
                        </FormControl>
                        <FormControl style={styles.formControlLimit}>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit' />}
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                <div>
                    { inProgress ? (
                        <div style={styles.loading}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    ) : (
                        <div>
                            { alertData.length === 0
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
                                    <div style={styles.tableWrapper}>
                                        <CustomTable data={alertData} />
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

APIMAlertSummary.propTypes = {
    height: PropTypes.string.isRequired,
    alertData: PropTypes.instanceOf(Object).isRequired,
    apiList: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
    themeName: PropTypes.string.isRequired,
    selectedApi: PropTypes.string.isRequired,
    limit: PropTypes.string.isRequired,
    handleApiChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
};
