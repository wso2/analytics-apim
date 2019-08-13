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
import { FormattedMessage } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import VizG from 'react-vizgrammar';

/**
 * React Component for APIM Api Latency Time widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Latency Time widget body
 */
export default function APIMApiLatency(props) {
    const {
        themeName, queryParam, chartConfig, metadata, height, width, apiCreatedBy, apiSelected,
        apiVersion, latencyData, apilist,
        versionlist, resourceList, apiCreatedHandleChange, apiSelectedHandleChange,
        apiVersionHandleChange, handleLatencyChange,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '97%',
        },
        formWrapper: {
            width: '90%',
            height: '20%',
            margin: 'auto',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            margin: '5%',
            minWidth: 120,
        },
        selectEmpty: {
            marginTop: 10,
        },
        dataWrapper: {
            height: '70%',
            width: '100%',
            margin: 'auto',
        },
    };
    return (
        <Scrollbars
            style={{ height }}
        >
            <div
                style={{
                    padding: '5% 5%',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        width: '40%',
                        paddingBottom: '15px',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='API LATENCY TIME' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form}>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='api-createdBy-label-placeholder'>
                                <FormattedMessage id='createdBy.label' defaultMessage='API Created By' />
                            </InputLabel>
                            <Select
                                value={apiCreatedBy}
                                onChange={apiCreatedHandleChange}
                                input={<Input name='apiCreatedBy' id='api-createdBy-label-placeholder' />}
                                displayEmpty
                                name='apiCreatedBy'
                                style={styles.selectEmpty}
                            >
                                <MenuItem value='All'>
                                    <FormattedMessage id='all.menuItem' defaultMessage='All' />
                                </MenuItem>
                                <MenuItem value='Me'>
                                    <FormattedMessage id='me.menuItem' defaultMessage='Me' />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='apiSelected-label-placeholder'>
                                <FormattedMessage id='apiName.label' defaultMessage='API Name' />
                            </InputLabel>
                            <Select
                                value={apiSelected}
                                onChange={apiSelectedHandleChange}
                                input={<Input name='apiSelected' id='apiSelected-label-placeholder' />}
                                displayEmpty
                                name='apiSelected'
                                style={styles.selectEmpty}
                            >
                                {
                                    apilist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='apiVersion-label-placeholder'>
                                <FormattedMessage id='apiVersion.label' defaultMessage='API Version' />
                            </InputLabel>
                            <Select
                                value={apiVersion}
                                onChange={apiVersionHandleChange}
                                input={<Input name='apiVersion' id='apiVersion-label-placeholder' />}
                                displayEmpty
                                name='apiVersion'
                                style={styles.selectEmpty}
                            >
                                {
                                    versionlist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl component='fieldset' style={styles.formControl}>
                            <FormLabel component='legend'>
                                <FormattedMessage id='resources.label' defaultMessage='Resources' />
                            </FormLabel>
                            <FormGroup>
                                {
                                    resourceList.map(option => (
                                        <FormControlLabel
                                            control={(
                                                <Checkbox
                                                    checked={queryParam.resSelected.includes(option.toString())}
                                                    onChange={handleLatencyChange}
                                                    value={option.toString()}
                                                />
                                            )}
                                            label={option}
                                        />
                                    ))
                                }
                            </FormGroup>
                            <FormHelperText>Select 1 or more resources</FormHelperText>
                        </FormControl>
                    </form>
                </div>
                <div style={styles.dataWrapper}>
                    <VizG
                        config={chartConfig}
                        metadata={metadata}
                        data={latencyData}
                        width={width}
                    />
                </div>
            </div>
        </Scrollbars>
    );
}

APIMApiLatency.propTypes = {
    themeName: PropTypes.string.isRequired,
    queryParam: PropTypes.instanceOf(Object).isRequired,
    chartConfig: PropTypes.instanceOf(Object).isRequired,
    metadata: PropTypes.instanceOf(Object).isRequired,
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    apiCreatedBy: PropTypes.string.isRequired,
    apiSelected: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    apilist: PropTypes.instanceOf(Object).isRequired,
    versionlist: PropTypes.instanceOf(Object).isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    latencyData: PropTypes.instanceOf(Object).isRequired,
    apiCreatedHandleChange: PropTypes.func.isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
    apiVersionHandleChange: PropTypes.func.isRequired,
    handleLatencyChange: PropTypes.func.isRequired,
};
