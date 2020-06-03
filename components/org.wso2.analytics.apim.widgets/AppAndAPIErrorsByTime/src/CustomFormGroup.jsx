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
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
});

function CustomFormGroup(props) {
    const {
        classes, selectedApp, selectedAPI, selectedVersion, selectedResource, apiList, appList,
        versionList, operationList, selectedLimit,
        handleApplicationChange, handleAPIChange, handleVersionChange, handleOperationChange, handleLimitChange,
    } = props;

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
                        {appList.map((row, i) => (
                            <MenuItem value={i}>{row[0] + ' ( ' + row[1] + ' )'}</MenuItem>
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
                            <MenuItem value={row}>{row}</MenuItem>
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
                        {versionList.map((row, i) => (
                            <MenuItem value={i}>{row[1]}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                        {operationList.map((row, i) => (
                            <MenuItem value={i}>{row[0] + ' ( ' + row[1] + ' )'}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
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

CustomFormGroup.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomFormGroup);

CustomFormGroup.propTypes = {
    classes: PropTypes.func.isRequired,
    handleApplicationChange: PropTypes.func.isRequired,
    handleAPIChange: PropTypes.func.isRequired,
    handleVersionChange: PropTypes.func.isRequired,
    handleOperationChange: PropTypes.func.isRequired,
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
};
