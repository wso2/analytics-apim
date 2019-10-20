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
import { Scrollbars } from 'react-custom-scrollbars';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CustomTable from './CustomTable';

/**
 * React Component for Faulty Invocations per App widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Faulty Invocations per App widget body
 */
export default function APIMFaultyPerApp(props) {
    const {
        themeName, height, limit, applicationSelected, usageData, applicationList,
        applicationSelectedHandleChange, handleLimitChange, inProgress,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '90%',
        },
        formWrapper: {
            width: '90%',
            height: '10%',
            margin: 'auto',
        },
        formControl: {
            marginTop: '5%',
            marginLeft: '5%',
        },
        textField: {
            marginTop: 0,
            minWidth: 120,
            width: '30%',
        },
        select: {
            paddingTop: 5,
            marginTop: 10,
            minWidth: 300,
        },
        table: {
            paddingTop: 35,
            margin: 'auto',
            width: '90%',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '10px',
            margin: 'auto',
            marginTop: 0,
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
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
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
    };

    return (
        <Scrollbars style={{ height }}>
            <div style={{ padding: '5% 5%' }}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='FAULTY INVOCATIONS PER APPLICATION' />
                    </h3>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form} noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='applicationSelected-label-placeholder'>
                                <FormattedMessage id='applicationName.label' defaultMessage='Application Name' />
                            </InputLabel>
                            <Select
                                value={applicationSelected}
                                onChange={applicationSelectedHandleChange}
                                input={(
                                    <Input
                                        name='applicationSelected'
                                        id='applicationSelected-label-placeholder'
                                    />
                                )}
                                displayEmpty
                                name='applicationSelected'
                                style={styles.select}
                            >
                                { applicationList.length > 0 ?
                                    applicationList.map(option => (
                                        <MenuItem key={option.appId} value={option.appId}>
                                            {option.appName}
                                        </MenuItem>
                                    ))
                                     :
                                    <MenuItem disabled>
                                        <FormattedMessage
                                            id='no.applications' defaultMessage='No Applications Available' />
                                    </MenuItem>
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                style={styles.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                <div style={styles.table}>
                    { inProgress ? (
                        <div style={styles.inProgress}>
                            <CircularProgress />
                        </div>
                        ) : (
                        <div>
                            { usageData.length > 0 ? (
                                <CustomTable
                                    data={usageData}
                                    inProgress={inProgress}
                                />
                            ) : (
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
                                                defaultMessage='No data available for the selected options.'
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            )}
                        </div>
                        )}
                </div>
            </div>
        </Scrollbars>
    );
}

APIMFaultyPerApp.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    limit: PropTypes.string.isRequired,
    applicationSelected: PropTypes.string.isRequired,
    applicationList: PropTypes.array.isRequired,
    usageData: PropTypes.array.isRequired,
    applicationSelectedHandleChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};