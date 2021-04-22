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
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VizG from 'react-vizgrammar';
import IntegrationReactSelect from '../../AppAndAPIErrorsByTime/src/IntegrationReactSelect';

/**
 * React Component for APIM Api Latency Time widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Latency Time widget body
 */
export default function APIMApiLatency(props) {
    const {
        themeName, queryParam, height, width, inProgress, latencyData, resourceList, apiOperationHandleChange,
        apiResourceHandleChange, limit, handleLimitChange,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: 15,
            minWidth: '10%',
            marginTop: 12,
        },
        autoSelectForm: {
            minWidth: 300,
            marginTop: 10,
        },
        dataWrapper: {
            height: '70%',
            width: '100%',
            margin: 'auto',
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
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        selectDiv: {
            marginTop: 15,
        },
    };
    const chartConfig = {
        x: 'REQUEST_TIME',
        yAxisLabel: 'LATENCY TIME (MS)',
        charts: [
            {
                type: 'line',
                y: 'Response Time',
                fill: '#1a911c',
            },
            {
                type: 'line',
                y: 'Security',
                fill: '#bb3a1c',
            },
            {
                type: 'line',
                y: 'Throttling',
                fill: '#aabb2e',
            },
            {
                type: 'line',
                y: 'Request Mediation',
                fill: '#33bbb5',
            },
            {
                type: 'line',
                y: 'Response Mediation',
                fill: '#b420bb',
            },
            {
                type: 'line',
                y: 'Backend',
                fill: '#bbb2b9',
            },
            {
                type: 'line',
                y: 'Other',
                fill: '#bb780f',
            },
        ],
        maxLength: 60,
        height: 400,
        append: false,
        xAxisTickCount: 6,
        interactiveLegend: true,
        legend: true,
        disableVerticalGrid: true,
        timeFormat: '%d-%b-%y %H:%M',
        tipTimeFormat: '%Y-%m-%d %H:%M:%S',
        ignoreYaxisDecimalPoints: true,
        style: {
            xAxisTickAngle: -8,
            tickLabelColor: '#a7b0c8',
            axisLabelColor: '#a7b0c8',
            axisTextSize: 50,
            legendTextColor: '#a7b0c8',
            legendTextSize: 15,
        },
    };
    const metadata = {
        names: ['Response Time', 'Security', 'Throttling', 'Request Mediation',
            'Response Mediation', 'Backend', 'Other', 'REQUEST_TIME'],
        types: ['linear', 'linear', 'linear', 'linear', 'linear', 'linear', 'linear', 'time'],
    };
    // Check whether the API is graphQL.
    // Evaluated by checking the method of the first resource.
    const graphQLOps = ['MUTATION', 'QUERY', 'SUBSCRIPTION'];
    const isGraphQL = resourceList.length > 0 && !!resourceList.find(op => graphQLOps.includes(op.HTTP_METHOD));
    const { operationSelected } = queryParam;

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div
                style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    margin: '10px',
                    padding: '20px',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='API LATENCY TIME' />
                    </div>
                    {
                        resourceList && resourceList.length > 0 && (
                            <div style={styles.formWrapper}>
                                <form style={styles.form}>
                                    <FormControl component='fieldset' style={styles.autoSelectForm}>
                                        <InputLabel
                                            shrink
                                            htmlFor='limit-number'
                                            style={styles.formLabel}
                                        >
                                            <FormattedMessage id='resource.label' defaultMessage='Resource' />
                                        </InputLabel>
                                        <div style={styles.selectDiv}>
                                            <IntegrationReactSelect
                                                isMulti={isGraphQL}
                                                options={resourceList}
                                                value={operationSelected}
                                                onChange={isGraphQL
                                                    ? apiOperationHandleChange : apiResourceHandleChange}
                                                // disabled={operationList && operationList.length === 0}
                                                placeholder='Select Operation'
                                                getLabel={item => item.URL_PATTERN + ' ( ' + item.HTTP_METHOD + ' )'}
                                                getValue={item => item.URL_PATTERN + ' ' + item.HTTP_METHOD}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormControl style={styles.formControl}>
                                        <InputLabel
                                            shrink
                                            htmlFor='limit-number'
                                            style={styles.formLabel}
                                        >
                                            <FormattedMessage id='limit' defaultMessage='Limit' />
                                        </InputLabel>
                                        <Input
                                            id='limit-number'
                                            value={limit}
                                            onChange={handleLimitChange}
                                            type='number'
                                            margin='normal'
                                        />
                                    </FormControl>
                                </form>
                            </div>
                        )
                    }
                </div>
                { inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        { !latencyData || latencyData.length === 0 ? (
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
                                <VizG
                                    config={chartConfig}
                                    metadata={metadata}
                                    data={latencyData}
                                    width={width}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMApiLatency.propTypes = {
    themeName: PropTypes.string.isRequired,
    queryParam: PropTypes.instanceOf(Object).isRequired,
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    latencyData: PropTypes.instanceOf(Object).isRequired,
    apiOperationHandleChange: PropTypes.func.isRequired,
    apiResourceHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    limit: PropTypes.string.isRequired,
};
