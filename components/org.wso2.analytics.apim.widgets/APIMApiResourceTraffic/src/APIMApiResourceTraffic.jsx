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
import { colorScale } from '@analytics-apim/common-lib';
import Moment from 'moment';

import {
    VictoryAxis, VictoryLabel, VictoryTooltip, VictoryStack,
    VictoryGroup, VictoryPortal, VictoryLegend, VictoryChart, VictoryBar,
} from 'victory';

const timeFormat = 'YY/DD/MM, HH:mm:ss';

/**
 * React Component for APIM Resource Traffic widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Resource Traffic widget body
 */
export default function APIMApiResourceTraffic(props) {
    const {
        themeName, queryParam, height, apiSelected, inProgress,
        apiVersion, apilist, versionlist, resourceList, apiSelectedHandleChange,
        apiVersionHandleChange, apiOperationHandleChange, dataarray, legendDataSet,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '96%',
            height: '7%',
            alignItems: 'left',
        },
        formWrapper: {
            marginBottom: 0,
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: 5,
            marginBottom: 20,
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
            height: 550,
        },
        svgViewBox: {
            fill: themeName === 'dark' ? '#fff' : '#000',
            fontFamily: 'inherit',
            fontSize: 8,
            fontStyle: 'italic',
        },
    };

    const xValues = {};
    if (legendDataSet.length > 0) {
        dataarray.forEach((datum, i) => {
            datum.forEach((dataUnit) => {
                if (legendDataSet[i]) {
                    const date = dataUnit[0];
                    const label = legendDataSet[i].name;
                    xValues[date] = xValues[date] || {};
                    xValues[date][label] = xValues[date][label] || [...dataUnit];
                }
            });
        });
    }
    const data = {};

    Object.keys(xValues).forEach((key) => {
        legendDataSet.forEach((legendItem) => {
            data[legendItem.name] = data[legendItem.name] || [];
            if (xValues[key][legendItem.name]) {
                data[legendItem.name].push(xValues[key][legendItem.name]);
            } else {
                data[legendItem.name].push([parseInt(key, 10), null]);
            }
        });
    });

    const stackGroups = Object.values(data).map((datum) => {
        return (
            <VictoryBar
                alignment='start'
                data={datum.map(([x, success = 0, throttled = 0, faulted = 0]) => {
                    const y = success + throttled + faulted;
                    return {
                        x,
                        y,
                        label: `${Moment(x).format(timeFormat)}\n ${y} Hits`,
                    };
                })}
                labelComponent={<VictoryTooltip />}
            />
        );
    });

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
        <Scrollbars
            style={{
                height,
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            }}
        >
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='API RESOURCE TRAFFIC' />
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
                    </form>
                </div>
                {inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        {!dataarray || dataarray.length === 0 || queryParam.operationSelected.length === 0 ? (
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
                                    <VictoryChart
                                        scale={{ x: 'time' }}
                                        domainPadding={{ y: 20, x: 20 }}
                                    >
                                        <VictoryLegend
                                            standalone={false}
                                            x={300}
                                            colorScale={colorScale}
                                            rowGutter={styles.rowGutter}
                                            style={styles.victoryLegend}
                                            data={legendDataSet}
                                        />
                                        <VictoryLabel
                                            x={30}
                                            y={30}
                                            style={styles.svgViewBox}
                                            text='HITS'
                                        />
                                        <VictoryAxis
                                            scale='time'
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
                                                    size: 5,
                                                    stroke: themeName === 'dark' ? '#fff' : '#000',
                                                    strokeWidth: 1,
                                                },
                                            }}
                                            label='TIME'
                                            tickFormat={
                                                (x) => {
                                                    return Moment(x).format('YY/MM/DD hh:mm');
                                                }
                                            }
                                            tickLabelComponent={(
                                                <VictoryLabel
                                                    // dx={-5}
                                                    // dy={-5}
                                                    // angle={-40}
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
                                                    dy={15}
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
                                        <VictoryStack colorScale={colorScale}>
                                            {stackGroups}
                                        </VictoryStack>
                                    </VictoryChart>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMApiResourceTraffic.propTypes = {
    themeName: PropTypes.string.isRequired,
    queryParam: PropTypes.instanceOf(Object).isRequired,
    height: PropTypes.string.isRequired,
    apiSelected: PropTypes.string.isRequired,
    apiVersion: PropTypes.string.isRequired,
    apilist: PropTypes.instanceOf(Object).isRequired,
    versionlist: PropTypes.instanceOf(Object).isRequired,
    resourceList: PropTypes.instanceOf(Object).isRequired,
    dataarray: PropTypes.instanceOf(Object).isRequired,
    legendDataSet: PropTypes.instanceOf(Object).isRequired,
    apiSelectedHandleChange: PropTypes.func.isRequired,
    apiVersionHandleChange: PropTypes.func.isRequired,
    apiOperationHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
