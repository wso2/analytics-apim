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
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import CustomTable from './CustomTable';

/**
 * Display API resource usage of application stats
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the App Resource Usage  widget body
 */
export default function APIMAppResourceUsage(props) {
    const {
        themeName, height, limit, applicationSelected, usageData, applicationList, applicationSelectedHandleChange,
        handleLimitChange, inProgress,
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
        div: {
            padding: '5% 5%',
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
    };

    return (
        <Scrollbars style={{ height }}>
            <div style={styles.div}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='RESOURCE USAGE OF APPLICATION' />
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
                                { applicationList.length > 0
                                    ? applicationList.map(option => (
                                        <MenuItem key={option.appId} value={option.appId}>
                                            {option.appName}
                                        </MenuItem>
                                    ))
                                    : (
                                        <MenuItem disabled>
                                            <FormattedMessage
                                                id='no.applications'
                                                defaultMessage='No Applications Available'
                                            />
                                        </MenuItem>
                                    )
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
                    <CustomTable
                        data={usageData}
                        inProgress={inProgress}
                    />
                </div>
            </div>
        </Scrollbars>
    );
}

APIMAppResourceUsage.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    limit: PropTypes.string.isRequired,
    applicationSelected: PropTypes.number.isRequired,
    applicationList: PropTypes.instanceOf(Object).isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    applicationSelectedHandleChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
