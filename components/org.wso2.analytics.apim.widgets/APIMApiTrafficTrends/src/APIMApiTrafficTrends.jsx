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
import {
    VictoryAxis, VictoryLabel, VictoryLine, VictoryTooltip, VictoryLegend,
} from 'victory';
import Moment from 'moment';

/**
 * React Component for APIM Traffic Trends widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Traffic Trends widget body
 */
export default function APIMApiTrafficTrends(props) {
    const {
        themeName, queryParam, height, apiSelected, inProgress,
        apiVersion, apilist, versionlist, resourceList, apiSelectedHandleChange,
        apiVersionHandleChange, apiOperationHandleChange, xAxisTicks, maxCount, dataarray, legandDataSet,
    } = props;
    const colorScale = ['#385dbd', '#83FF33', '#CB33FF', '#FF335C', '#33FFF5', '#FF9633'];
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '96%',
            height: '7%',
            alignItems: 'left',
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
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '100%',
            padding: '4%',
            border: '1.5px solid #fff',
            marginTop: '20%',
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
        rowGutter: {
            top: 0,
            bottom: -10,
        },
        victoryLegend: {
            labels: {
                fill: '#9e9e9e',
                fontSize: 10,
            },
        },
        heading: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '10px',
            margin: 'auto',
            marginTop: 0,
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
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
        },
        svgViewBox: {
            fill: themeName === 'dark' ? '#fff' : '#000',
            fontFamily: 'inherit',
            fontSize: 8,
            fontStyle: 'italic',
        },
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
        <Scrollbars style={{ height }}>
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
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
                                <FormattedMessage id='resources.label' defaultMessage='Resources' />
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
                                )
                            }
                        </FormControl>
                        { inProgress ? (
                            <div style={styles.loading}>
                                <CircularProgress style={styles.loadingIcon} />
                            </div>
                        ) : (
                            <div>
                                { !dataarray || dataarray.length === 0 || queryParam.operationSelected.length === 0 ? (
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
                                        <div style={styles.chart}>
                                            <svg viewBox='20 25 650 300' style={styles.svgWrapper}>
                                                <VictoryLabel
                                                    x={30}
                                                    y={65}
                                                    style={styles.svgViewBox}
                                                    text='HITS'
                                                />
                                                <g transform='translate(0, 40)'>
                                                    <VictoryAxis
                                                        scale='time'
                                                        standalone={false}
                                                        width={700}
                                                        style={{
                                                            grid: {
                                                                stroke: tick => (tick === 0
                                                                    ? 'transparent' : '#313f46'),
                                                                strokeWidth: 1,
                                                            },
                                                            axis: {
                                                                stroke: themeName === 'dark' ? '#fff' : '#000',
                                                                strokeWidth: 1,
                                                            },
                                                            ticks: {
                                                                size: 5,
                                                                stroke: themeName === 'dark' ? '#fff' : '#000',
                                                                strokeWidth: 1,
                                                            },
                                                        }}
                                                        label='TIME'
                                                        tickValues={xAxisTicks}
                                                        tickFormat={
                                                            (x) => {
                                                                return Moment(x).format('YY/MM/DD hh:mm');
                                                            }
                                                        }
                                                        tickLabelComponent={(
                                                            <VictoryLabel
                                                                dx={-5}
                                                                dy={-5}
                                                                angle={-40}
                                                                style={{
                                                                    fill: themeName === 'dark'
                                                                        ? '#fff' : '#000',
                                                                    fontFamily: themeName === 'dark'
                                                                        ? '#fff' : '#000',
                                                                    fontSize: 8,
                                                                }}
                                                            />
                                                        )}
                                                        axisLabelComponent={(
                                                            <VictoryLabel
                                                                dy={20}
                                                                style={{
                                                                    fill: themeName === 'dark' ? '#fff' : '#000',
                                                                    fontFamily: 'inherit',
                                                                    fontSize: 8,
                                                                    fontStyle: 'italic',
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <VictoryAxis
                                                        dependentAxis
                                                        width={700}
                                                        domain={[1, maxCount]}
                                                        offsetX={50}
                                                        orientation='left'
                                                        standalone={false}
                                                        style={{
                                                            grid: {
                                                                stroke: tick => (tick === 0
                                                                    ? 'transparent' : '#313f46'),
                                                                strokeWidth: 1,
                                                            },
                                                            axis: {
                                                                stroke: themeName === 'dark' ? '#fff' : '#000',
                                                                strokeWidth: 1,
                                                            },
                                                            ticks: {
                                                                strokeWidth: 0,
                                                            },
                                                            tickLabels: {
                                                                fill: themeName === 'dark' ? '#fff' : '#000',
                                                                fontFamily: 'inherit',
                                                                fontSize: 8,
                                                            },
                                                        }}
                                                    />
                                                    {
                                                        dataarray.map((p, element) => (
                                                            <VictoryLine
                                                                data={p}
                                                                labels={d => d.label}
                                                                width={700}
                                                                domain={{
                                                                    y: [1, maxCount],
                                                                }}
                                                                scale={{ x: 'time', y: 'linear' }}
                                                                standalone={false}
                                                                style={{
                                                                    data: {
                                                                        stroke: themeName === 'dark'
                                                                            ? colorScale[element] : '#000',
                                                                        strokeWidth: 2,
                                                                    },
                                                                }}
                                                                labelComponent={(
                                                                    <VictoryTooltip
                                                                        orientation='right'
                                                                        pointerLength={0}
                                                                        cornerRadius={2}
                                                                        flyoutStyle={{
                                                                            fill: '#000',
                                                                            fillOpacity: '0.5',
                                                                            strokeWidth: 1,
                                                                        }}
                                                                        style={styles.tooltip}
                                                                    />
                                                                )}
                                                            />
                                                        ))
                                                    }
                                                </g>
                                                <VictoryLegend
                                                    standalone={false}
                                                    colorScale={colorScale}
                                                    x={575}
                                                    y={30}
                                                    gutter={10}
                                                    rowGutter={styles.rowGutter}
                                                    style={styles.victoryLegend}
                                                    data={legandDataSet}
                                                />
                                            </svg>
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

APIMApiTrafficTrends.propTypes = {
    themeName: PropTypes.string.isRequired,
    queryParam: PropTypes.instanceOf(Object).isRequired,
    height: PropTypes.string.isRequired,
    apiSelected: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    apilist: PropTypes.instanceOf(Object).isRequired,
    versionlist: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    dataarray: PropTypes.instanceOf(Object).isRequired,
    legandDataSet: PropTypes.instanceOf(Object).isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
    apiVersionHandleChange: PropTypes.func.isRequired,
    apiOperationHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    maxCount: PropTypes.number.isRequired,
};
