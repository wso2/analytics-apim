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
import Typography from '@material-ui/core/Typography';
import {
    VictoryChart, VictoryArea, VictoryAxis, VictoryLabel,
} from 'victory';
import Paper from '@material-ui/core/Paper';
import Moment from 'moment';
import { FormattedMessage } from 'react-intl';

/**
 * Display the Error details catogarizet by time
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render error Detail chart
 */
export default function errorDetailChart(props) {
    const { errorData, themeName, xAxisTicks } = props;
    const styles = {
        input: {
            display: 'none',
        },
        paper: {
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '50%',
            padding: '4%',
            margin: 'auto',
            marginTop: '5%',
            border: '1.5px solid',
        },
        headingWrapper: {
            height: '5%',
            margin: 'auto',
            paddingTop: '10px',
            width: '90%',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '7px',
            paddingTop: '7px',
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            width: '80%',
        },
        maindiv: {
            maxWidth: '100%',
            maxHeight: '450px',
            minWidth: '50%',
            minHeight: '450px',
            marginRight: '2px',
            backgroundColor: themeName === 'dark' ? '#040b4b' : '#E8E8E8',
            marginTop: '5px',
        },
        victry: {
            axisLabel: {
                padding: 40,
                fill: themeName === 'dark' ? '#fff' : '#02212f',
                fontSize: '8px',
            },
        },
        victoryArea: {
            data: {
                fill: themeName === 'dark' ? '#0e0e24' : '#2571a7',
            },
        },
        axisStyles: {
            grid: {
                stroke: 'none',
            },
            axis: {
                stroke: themeName === 'dark' ? '#0e0e24' : '#000',
                strokeWidth: 1,
            },
        },
        tickLabel: {
            fill: themeName === 'dark'
                ? '#fff' : '#000',
            fontFamily: themeName === 'dark'
                ? '#fff' : '#000',
            fontSize: 8,
        },
        axisLabel: {
            fill: themeName === 'dark' ? '#fff' : '#000',
            fontFamily: 'inherit',
            fontSize: 8,
        },
    };
    const chartTheme = {
        axis: {
            style: {
                tickLabels: {
                    fill: themeName === 'dark' ? '#fff' : '#02212f',
                    fontSize: '8px',
                    angle: 25,
                },
            },
        },
    };

    if (errorData === null || errorData.length === 0) {
        return (
            <div style={styles.maindiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='errorCount.heading'
                            defaultMessage='ERROR COUNT'
                        />
                    </h3>
                </div>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography
                        variant='h5'
                        component='h3'
                    >
                        <FormattedMessage
                            id='nodata.error.heading'
                            defaultMessage='No Data Available !'
                        />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options!.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    } else {
        return (
            <div style={styles.maindiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage
                            id='errorCount.heading'
                            defaultMessage='ERROR COUNT'
                        />
                    </h3>
                </div>
                <svg viewBox='-50 5 500 200'>
                    <VictoryChart
                        theme={chartTheme}
                        standalone={false}
                        width={400}
                        height={200}
                    >
                        <VictoryArea
                            animate={{
                                duration: 2000,
                                onLoad: { duration: 1000 },
                            }}
                            style={styles.victoryArea}
                            data={errorData}
                        />
                        <VictoryAxis
                            scale='time'
                            standalone={false}
                            width={700}
                            style={styles.axisStyles}
                            label='Time'
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
                                    angle={35}
                                    style={styles.tickLabel}
                                />
                            )}
                            axisLabelComponent={(
                                <VictoryLabel
                                    dy={20}
                                    style={styles.axisLabel}
                                />
                            )}
                        />
                        <VictoryAxis
                            dependentAxis
                            label='Api Error Count'
                            style={styles.victry}
                        />
                    </VictoryChart>
                </svg>
            </div>
        );
    }
}

errorDetailChart.propTypes = {
    themeName: PropTypes.string.isRequired,
    errorData: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
};
