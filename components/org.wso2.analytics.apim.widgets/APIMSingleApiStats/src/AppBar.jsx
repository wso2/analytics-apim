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
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';

/**
 * Display Api name and version Info
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render AppBars component
 */
export default function AppBars(props) {
    const {
        apiname, apiVersion, apiList, apiSelected, apiSelectedHandleChange,
    } = props;
    const styles = {
        formControl: {
            marginLeft: '60%',
            float: 'right',
            width: '20%',
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
        <div>
            <AppBar
                position='static'
                color='default'
            >
                <Toolbar>
                    <Typography
                        variant='h8'
                        color='inherit'
                    >
                        <FormattedMessage
                            id='appbar.heading'
                            defaultMessage='API Statistics'
                        />
                        {' > ' + apiname + ' ( ' + apiVersion + ' ) '}
                    </Typography>
                    <FormControl style={styles.formControl}>
                        <Tooltip
                            placement='top'
                            title={(
                                <FormattedMessage
                                    id='apiName.label'
                                    defaultMessage='API Name'
                                />
                            )}
                        >
                            <InputLabel
                                shrink
                                htmlFor='apiSelected-label-placeholder'
                                style={styles.formLabel}
                            >
                                <FormattedMessage
                                    id='apiName.label'
                                    defaultMessage='API Name'
                                />
                            </InputLabel>
                        </Tooltip>
                        <Select
                            value={apiSelected}
                            onChange={apiSelectedHandleChange}
                            input={(
                                <Input
                                    name='apiSelected'
                                    id='apiSelected-label-placeholder'
                                />
                            )}
                            displayEmpty
                            name='apiSelected'
                        >
                            {
                                apiList.map(option => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </Toolbar>
            </AppBar>
        </div>
    );
}

AppBars.propTypes = {
    apiname: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    apiList: PropTypes.instanceOf(Object).isRequired,
    apiSelected: PropTypes.string.isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
};
