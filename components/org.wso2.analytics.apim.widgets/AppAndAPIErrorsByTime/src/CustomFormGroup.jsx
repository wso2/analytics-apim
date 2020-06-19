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
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { FormattedMessage } from 'react-intl';
import Input from '@material-ui/core/Input';
import Chip from '@material-ui/core/Chip';

// import Autocomplete from '@material-ui/lab/Autocomplete';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        marginBottom: 50,
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
    },
    autocomplete: {
        margin: theme.spacing.unit,
        minWidth: 400,
        width: '20%',
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
    root: {
        border: 0,
        margin: theme.spacing.unit,
        display: 'inline-flex',
        padding: 0,
        position: 'relative',
        minWidth: 120,
        flexDirection: 'column',
        verticalAlign: 'top',
    },
});

function CustomFormGroup(props) {
    const {
        classes, selectedApp, selectedAPI, selectedVersion, selectedResource, apiList, appList,
        versionList, operationList, selectedLimit, selectedGraphQLResources, handleGraphQLOperationChange,
        handleApplicationChange, handleAPIChange, handleVersionChange, handleOperationChange, handleLimitChange,
    } = props;
    const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
    const graphQL = operationList.length > 0 && !!operationList.find(op => graphQLOps.includes(op.HTTP_METHOD));

    return (
        <div component={Paper}>
            <div>
                <FormControl className={classes.formControl}>
                    <InputLabel id='demo-simple-select-label'>Application</InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={selectedApp}
                        onChange={handleApplicationChange}
                    >
                        <MenuItem value={-1}>All</MenuItem>
                        {appList.map(row => (
                            <MenuItem value={row.APPLICATION_ID}>
                                {row.NAME + ' ( ' + row.CREATED_BY + ' )'}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl className={classes.formControl}>
                    <InputLabel id='demo-simple-select-label'>API Name</InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={selectedAPI}
                        onChange={handleAPIChange}
                    >
                        <MenuItem value={-1}>All</MenuItem>
                        {apiList.map(row => (
                            <MenuItem value={row[0]}>{row[0]}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel id='demo-simple-select-label'>API Version</InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={selectedVersion}
                        onChange={handleVersionChange}
                        disabled={versionList && versionList.length === 0}
                    >
                        <MenuItem value={-1}>All</MenuItem>
                        {versionList.map(row => (
                            <MenuItem value={row.API_ID}>{row.API_VERSION}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                { graphQL
                    ? (
                        <FormControl className={classes.formControl}>
                            <InputLabel id='demo-mutiple-chip-label'>Chip</InputLabel>
                            <Select
                                labelId='demo-mutiple-chip-label'
                                id='demo-mutiple-chip'
                                multiple
                                value={selectedGraphQLResources}
                                onChange={handleGraphQLOperationChange}
                                input={<Input id='select-multiple-chip' />}
                                renderValue={(selected) => {
                                    return (
                                        <div className={classes.chips}>
                                            {selected.map((opID) => {
                                                const foundOp = operationList.find(i => i.URL_MAPPING_ID === opID);
                                                return (
                                                    <Chip
                                                        key={opID}
                                                        label={foundOp.URL_PATTERN + ' ( ' + foundOp.HTTP_METHOD + ' )'}
                                                        className={classes.chip}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                }}
                                // MenuProps={MenuProps}
                            >
                                {operationList.map(row => (
                                    <MenuItem value={row.URL_MAPPING_ID}>
                                        {row.URL_PATTERN + ' ( ' + row.HTTP_METHOD + ' )'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <FormControl className={classes.formControl}>
                            <InputLabel id='demo-simple-select-label'>Operation</InputLabel>
                            <Select
                                labelId='demo-simple-select-label'
                                id='demo-simple-select'
                                value={selectedResource}
                                onChange={handleOperationChange}
                                disabled={operationList && operationList.length === 0}
                            >
                                <MenuItem value={-1}>All</MenuItem>
                                {operationList.map(row => (
                                    <MenuItem value={row.URL_MAPPING_ID}>
                                        {row.URL_PATTERN + ' ( ' + row.HTTP_METHOD + ' )'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )
                }

                <FormControl className={classes.formControl}>
                    <TextField
                        id='limit-number'
                        label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                        value={selectedLimit}
                        onChange={handleLimitChange}
                        type='number'
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </FormControl>
            </div>
        </div>
    );
}

export default withStyles(styles)(CustomFormGroup);

CustomFormGroup.propTypes = {
    classes: PropTypes.func.isRequired,
    handleApplicationChange: PropTypes.func.isRequired,
    handleAPIChange: PropTypes.func.isRequired,
    handleVersionChange: PropTypes.func.isRequired,
    handleOperationChange: PropTypes.func.isRequired,
    handleGraphQLOperationChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    selectedApp: PropTypes.number.isRequired,
    selectedAPI: PropTypes.number.isRequired,
    selectedVersion: PropTypes.number.isRequired,
    selectedResource: PropTypes.number.isRequired,
    selectedLimit: PropTypes.number.isRequired,
    apiList: PropTypes.instanceOf(Object).isRequired,
    appList: PropTypes.instanceOf(Object).isRequired,
    versionList: PropTypes.instanceOf(Object).isRequired,
    operationList: PropTypes.instanceOf(Object).isRequired,
    selectedGraphQLResources: PropTypes.instanceOf(Object).isRequired,
};
