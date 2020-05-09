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
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import VizG from 'react-vizgrammar';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';

/**
 * React Component for APIM Api Error Analysis body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Error Analysis widget body
 */
export default function APIMApiErrorAnalysis(props) {
    const {
        themeName, queryParam, height, apiSelected, inProgress,
        apiVersion, resultData, apiList, versionList, resourceList, apiSelectedHandleChange,
        apiVersionHandleChange, apiOperationHandleChange, apiResourceHandleChange,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '96%',
        },
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: '5%',
            minWidth: 120,
        },
        selectEmpty: {
            marginTop: 15,
            fontSize: '16px',
        },
        dataWrapper: {
            height: '70%',
            width: '100%',
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
        categoryAxis: {
            grid: {
                stroke: 'none',
            },
        },
        marksAxis: {
            grid: {
                strokeWidth: 1,
                strokeDasharray: '10,0',
                zIndex: -9,
            },
        },
        checkbox: {
            fontsize: '1px',
            fontWeight: 50,
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        mainDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            height,
            margin: '10px',
            padding: '20px',
        },
        chart: {
            height: 450,
            width: 800,
            marginLeft: '25px',
            marginTop: '10px',
        },
    };
    const ordinalDataChart = {
        x: 'Time',
        charts: [
            {
                type: 'bar',
                y: 'Error Count',
                color: 'responseCode',
                mode: 'stacked',

            },
        ],
        legend: true,
        style: {
            barWidth: 5,
        },
    };
    const ordinalMetadata = {
        names: ['Time', 'Error Count', 'responseCode'],
        types: ['ordinal', 'linear', 'ordinal'],
    };


    /**
     * Check whether the API is graphQL.
     * Evaluated by checking the method of the first resource.
     */
    let isGraphQL;
    if (resourceList.length > 0) {
        const resFormat = resourceList[0].split(' (');
        const method = resFormat[1].replace(')', '');
        isGraphQL = (method === 'QUERY' || method === 'MUTATION' || method === 'SUBSCRIPTION');
    }

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}>
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
                        <FormattedMessage
                            id='widget.heading'
                            defaultMessage='API ERROR ANALYSIS'
                        />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form}>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='apiSelected-label-placeholder'>
                                <FormattedMessage
                                    id='apiName.label'
                                    defaultMessage='API Name'
                                />
                            </InputLabel>
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
                                style={styles.selectEmpty}
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
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='apiVersion-label-placeholder'>
                                <FormattedMessage
                                    id='apiVersion.label'
                                    defaultMessage='API Version'
                                />
                            </InputLabel>
                            <Select
                                value={apiVersion}
                                onChange={apiVersionHandleChange}
                                input={(
                                    <Input
                                        name='apiVersion'
                                        id='apiVersion-label-placeholder'
                                    />
                                )}
                                displayEmpty
                                name='apiVersion'
                                style={styles.selectEmpty}
                            >
                                {
                                    versionList.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl
                            component='fieldset'
                            style={styles.formControl}
                        >
                            <FormLabel component='legend'>
                                <FormattedMessage
                                    id='resources.label'
                                    defaultMessage='Resources'
                                />
                            </FormLabel>
                            {
                                isGraphQL ? (
                                    <FormGroup>
                                        {
                                            resourceList.map(option => (
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={
                                                                queryParam.operationSelected.includes(option.toString())
                                                            }
                                                            onChange={apiOperationHandleChange}
                                                            value={option.toString()}
                                                        />
                                                    )}
                                                    label={option}
                                                />
                                            ))
                                        }
                                    </FormGroup>
                                ) : (
                                    <RadioGroup>
                                        {
                                            resourceList.map(option => (
                                                <FormControlLabel
                                                    control={(
                                                        <Radio
                                                            checked={
                                                                queryParam.resourceSelected.includes(option.toString())
                                                            }
                                                            onChange={apiResourceHandleChange}
                                                            value={option.toString()}
                                                        />
                                                    )}
                                                    label={option}
                                                    classes={{ label: styles.checkbox }}
                                                />
                                            ))
                                        }
                                    </RadioGroup>
                                )
                            }
                        </FormControl>
                    </form>
                </div>
                { inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        {!resultData || resultData.length === 0 ? (
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
                        ) : (
                            <div style={styles.dataWrapper}>
                                <div>
                                    <div style={styles.chart}>
                                        <VizG
                                            config={ordinalDataChart}
                                            metadata={ordinalMetadata}
                                            data={resultData}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMApiErrorAnalysis.propTypes = {
    themeName: PropTypes.string.isRequired,
    queryParam: PropTypes.instanceOf(Object).isRequired,
    height: PropTypes.string.isRequired,
    apiSelected: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    apiList: PropTypes.instanceOf(Object).isRequired,
    versionList: PropTypes.instanceOf(Object).isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    resultData: PropTypes.instanceOf(Object).isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
    apiVersionHandleChange: PropTypes.func.isRequired,
    apiOperationHandleChange: PropTypes.func.isRequired,
    apiResourceHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
