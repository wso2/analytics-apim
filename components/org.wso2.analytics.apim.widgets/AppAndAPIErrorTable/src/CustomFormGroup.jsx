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
import Autocomplete from '@material-ui/lab/Autocomplete';
import { ViewTypeEnum, DrillDownEnum } from './Constants';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        marginBottom: 50,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    autocomplete: {
        margin: theme.spacing(1),
        minWidth: 400,
        width: '20%',
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
});

function CustomFormGroup(props) {
    const {
        classes, viewType, drillDownType, selectedApp, selectedAPI, selectedVersion, selectedResource, apiList, appList,
        versionList, operationList, selectedLimit, handleGraphQLOperationChange, selectedGraphQLResources,
        handleApplicationChange, handleAPIChange, handleVersionChange, handleOperationChange, handleLimitChange,
    } = props;
    const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION']
    const graphQL = operationList.length > 0 && !!operationList.find(op => graphQLOps.includes(op.HTTP_METHOD));
    return (
        <div component={Paper}>
            <div>
                { viewType === ViewTypeEnum.APP ? (
                    <FormControl className={classes.formControl}>
                        <InputLabel><FormattedMessage id='label.app' defaultMessage='Application' /></InputLabel>
                        <Select
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
                ) : '' }

                <FormControl className={classes.formControl}>
                    <InputLabel><FormattedMessage id='label.apiName' defaultMessage='API Name' /></InputLabel>
                    <Select
                        value={selectedAPI}
                        onChange={handleAPIChange}
                    >
                        <MenuItem value={-1}>All</MenuItem>
                        {apiList.map(row => (
                            <MenuItem value={row.API_NAME}>{row.API_NAME}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                { drillDownType === DrillDownEnum.VERSION || drillDownType === DrillDownEnum.RESOURCE ? (
                    <FormControl className={classes.formControl}>
                        <InputLabel><FormattedMessage id='label.apiVersion' defaultMessage='API Version' /></InputLabel>
                        <Select
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
                ) : '' }

                { drillDownType === DrillDownEnum.RESOURCE && !graphQL
                && (
                    <FormControl className={classes.formControl}>
                        <InputLabel><FormattedMessage id='label.operation' defaultMessage='Operation' /></InputLabel>
                        <Select
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
                )}

                { drillDownType === DrillDownEnum.RESOURCE && graphQL
                && (
                    <FormControl className={classes.autocomplete}>
                        <Autocomplete
                            multiple
                            id='tags-standard'
                            options={operationList}
                            getOptionLabel={(option) => {
                                if (option === -1) {
                                    return 'ALL';
                                }
                                return option.URL_PATTERN + ' ( ' + option.HTTP_METHOD + ' )';
                            }}
                            defaultValue={selectedGraphQLResources}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    variant='standard'
                                    label='Operations'
                                />
                            )}
                            onChange={handleGraphQLOperationChange}
                        />
                    </FormControl>
                )}

                <FormControl className={classes.formControl}>
                    <TextField
                        id='limit-number'
                        label={<FormattedMessage id='limit' defaultMessage='Limit' />}
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
    viewType: PropTypes.string.isRequired,
    drillDownType: PropTypes.string.isRequired,
};

export default withStyles(styles)(CustomFormGroup);
