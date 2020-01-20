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
 * @returns {ReactElement} Render the APIM Api Latency Time widget body
 */
export default function APIMApiErrorAnalysis(props) {
    const {
        themeName, queryParam, height, apiSelected, inProgress,
        apiVersion, resultdata, apilist, versionlist, resourceList, apiSelectedHandleChange,
        apiVersionHandleChange, apiOperationHandleChange, apiResourceHandleChange,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '97%',
        },
        formWrapper: {
            width: '100%',
            height: '20%',
            margin: 'auto',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginTop: '4%',
            marginLeft: '2%',
            marginRight: '3%',
            minWidth: 175,
            maxWidth: 175,
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
        },
        paper: {
            background: '#969696',
            width: '100%',
            padding: '4%',
            border: '1.5px solid #fff',
            // margin: 'auto',
            marginTop: '5%',
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
    };

    // Check whether the API is graphQL.
    // Evaluated by checking the method of the first resource.
    let isGraphQL;
    if (resourceList.length > 0) {
        const resFormat = resourceList[0].split(' (');
        const method = resFormat[1].replace(')', '');
        isGraphQL = (method === 'QUERY' || method === 'MUTATION' || method === 'SUBSCRIPTION');
    }


    const ordinalDataChart = {
        x: 'Time',
        charts: [
            {
                type: 'bar',
                y: 'Hits',
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
        names: ['Time', 'Hits', 'responseCode'],
        types: ['ordinal', 'linear', 'ordinal'],
    };


    return (
        <Scrollbars
            style={{ height }}
        >
            <div
                style={{
                    padding: '3% 3%',
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
                        <FormattedMessage id='widget.heading' defaultMessage='API ERROR ANALYSIS' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form}>
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
                                {/* <FormattedMessage id='resources.label' defaultMessage='Resources' /> */}
                                Resources
                            </FormLabel>
                            {
                                isGraphQL ? (
                                    <FormGroup>
                                        {
                                            resourceList.map(option => (
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={queryParam.operationSelected.includes(option.toString())}
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
                                                            checked={queryParam.resourceSelected.includes(option.toString())}
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
                        { inProgress ? (
                            <div style={styles.loading}>
                                <CircularProgress style={styles.loadingIcon} />
                            </div>
                        ) : (
                            <div>
                                { !resultdata || resultdata.length === 0 ? (
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
                                            <div style={{ height: 450, width: 800, marginLeft: '25px' }}>
                                                <p style={{ textAlign: 'right', fontSize: '12px' }}>Response codes of the API    </p>
                                                <VizG
                                                    
                                                    config={ordinalDataChart}
                                                    metadata={ordinalMetadata}
                                                    data={resultdata}
                                                    // theme={this.props.theme}
                                                />
                                            </div>
                                            <div>
                                                <br />
                                                <br />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>
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
    apilist: PropTypes.instanceOf(Object).isRequired,
    versionlist: PropTypes.instanceOf(Object).isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    resultdata: PropTypes.instanceOf(Object).isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
    apiVersionHandleChange: PropTypes.func.isRequired,
    apiOperationHandleChange: PropTypes.func.isRequired,
    apiResourceHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
