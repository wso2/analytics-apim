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
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CustomTable from './CustomTable';

/**
 * React Component for Api Availability widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Availability widget body
 */
function ApiAvailability(props) {
    const {
        themeName, height, availableApiData, inProgress, limit, handleLimitChange, intl, status,
        handleStatusChange, username,
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
            paddingTop: 10,
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
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        formWrapper: {
            paddingBottom: 20,
        },
        formControl: {
            marginLeft: 10,
            marginTop: 10,
            width: '10%',
        },
        formControlSelect: {
            paddingRight: 10,
            marginLeft: 10,
            marginTop: 10,
            minWidth: 300,
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };
    const columns = [
        {
            id: 'apiname', numeric: false, disablePadding: false, label: 'table.heading.apiname',
        },
        {
            id: 'apiversion', numeric: true, disablePadding: false, label: 'table.heading.apiversion',
        },
        {
            id: 'status', numeric: false, disablePadding: false, label: 'table.heading.status',
        },
    ];
    const strColumns = columns.map((colObj) => {
        return intl.formatMessage({ id: colObj.label });
    });
    strColumns.push(intl.formatMessage({ id: 'table.heading.reason' }));
    const title = intl.formatMessage({ id: 'widget.heading' });
    const tableData = availableApiData.map((data) => {
        return {
            apiname: data.apiname,
            apiversion: data.apiversion,
            status: intl.formatMessage({ id: 'availability.' + data.status }),
            reason: data.reason,
        };
    });

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div style={{
                margin: '10px',
                padding: '20px',
            }}
            >
                <div style={styles.headingWrapper}>
                    <h3 style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='API AVAILABILITY' />
                    </h3>
                </div>
                <div style={styles.formWrapper}>
                    <form>
                        <FormControl style={styles.formControlSelect}>
                            <InputLabel style={styles.formLabel}>
                                <FormattedMessage id='status.label' defaultMessage='Status' />
                            </InputLabel>
                            <Select
                                value={status}
                                onChange={handleStatusChange}
                                MenuProps={{
                                    getContentAnchorEl: null,
                                    anchorOrigin: {
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    },
                                }}
                            >
                                <MenuItem value='all'>
                                    <FormattedMessage
                                        id='availability.all.label'
                                        defaultMessage='All'
                                    />
                                </MenuItem>
                                <MenuItem value='Available'>
                                    <FormattedMessage
                                        id='availability.available.label'
                                        defaultMessage='Available'
                                    />
                                </MenuItem>
                                <MenuItem value='Response time'>
                                    <FormattedMessage
                                        id='availability.response.time.label'
                                        defaultMessage='High Response Time'
                                    />
                                </MenuItem>
                                <MenuItem value='Server error'>
                                    <FormattedMessage
                                        id='availability.server.error.label'
                                        defaultMessage='Server Malfunction'
                                    />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            id='limit-number'
                            label={<FormattedMessage id='limit' defaultMessage='Limit' />}
                            value={limit}
                            onChange={handleLimitChange}
                            type='number'
                            style={styles.formControl}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin='normal'
                        />
                    </form>
                </div>
                <div>
                    { inProgress ? (
                        <div style={styles.inProgress}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    ) : (
                        <div>
                            { availableApiData.length === 0
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
                                        <CustomTable
                                            data={tableData}
                                            columns={columns}
                                            strColumns={strColumns}
                                            title={title}
                                            username={username}
                                        />
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

ApiAvailability.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    inProgress: PropTypes.bool.isRequired,
    availableApiData: PropTypes.instanceOf(Object).isRequired,
    limit: PropTypes.string.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    handleStatusChange: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    username: PropTypes.string.isRequired,
};

export default injectIntl(ApiAvailability);
