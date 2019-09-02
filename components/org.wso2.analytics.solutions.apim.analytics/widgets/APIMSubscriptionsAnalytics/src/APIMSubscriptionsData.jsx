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
import Moment from 'moment';
import Button from '@material-ui/core/Button';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {
    VictoryAxis, VictoryLabel, VictoryLine, VictoryTooltip,
} from 'victory';
import { FormattedMessage } from 'react-intl';
import CustomTable from './CustomTable';

/**
 * React Component for the data of APIM Subscriptions Analytics widget
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the data of APIM Subscriptions Analytics widget
 */
export default function APIMSubscriptionsData(props) {
    const {
        themeName, chartData, tableData, xAxisTicks, maxCount,
    } = props;
    const styles = {
        dataWrapper: {
            height: '78%',
            width: '97%',
            margin: 'auto',
        },
        chartWrapper: {
            width: '100%',
            height: '70%',
        },
        svgWrapper: {
            height: '100%',
            width: '100%',
        },
        tooltip: {
            fill: '#fff',
            fontSize: 8,
        },
        tableWrapper: {
            width: '80%',
            height: '30%',
            margin: 'auto',
            textAlign: 'right',
        },
        button: {
            backgroundColor: '#1d216b',
            width: '40%',
            height: '10%',
            color: '#fff',
            marginTop: '3%',
        },
    };

    if (tableData.length !== 0 && chartData.length !== 0) {
        return (
            <div style={styles.dataWrapper}>
                <div style={styles.chartWrapper}>
                    <svg viewBox='20 50 650 300' style={styles.svgWrapper}>
                        <VictoryLabel
                            x={30}
                            y={65}
                            style={{
                                fill: themeName === 'dark' ? '#fff' : '#000',
                                fontFamily: 'inherit',
                                fontSize: 8,
                                fontStyle: 'italic',
                            }}
                            text='COUNT'
                        />
                        <g transform='translate(0, 40)'>
                            <VictoryAxis
                                scale='time'
                                standalone={false}
                                width={700}
                                style={{
                                    grid: {
                                        stroke: tick => (tick === 0 ? 'transparent' : '#313f46'),
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
                                label='SUBSCRIBED TIME'
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
                                            fill: themeName === 'dark' ? '#fff' : '#000',
                                            fontFamily: themeName === 'dark' ? '#fff' : '#000',
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
                                domain={[1, maxCount]}
                                width={700}
                                offsetX={50}
                                orientation='left'
                                standalone={false}
                                style={{
                                    grid: {
                                        stroke: tick => (tick === 0 ? 'transparent' : '#313f46'),
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
                            <VictoryLine
                                data={chartData}
                                labels={d => d.label}
                                width={700}
                                domain={{
                                    x: [xAxisTicks[0], xAxisTicks[xAxisTicks.length - 1]],
                                    y: [1, maxCount],
                                }}
                                scale={{ x: 'time', y: 'linear' }}
                                standalone={false}
                                style={{
                                    data: {
                                        stroke: themeName === 'dark' ? '#fff' : '#000',
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
                        </g>
                    </svg>
                </div>
                <div style={styles.tableWrapper}>
                    <CustomTable
                        tableData={tableData}
                    />
                    <Button
                        variant='contained'
                        color='secondary'
                        style={styles.button}
                        onClick={() => {
                            window.location.href = './overview';
                        }}
                    >
                        <ArrowBack />
                        <FormattedMessage id='back.btn' defaultMessage='BACK' />
                    </Button>
                </div>
            </div>
        );
    } else {
        return (
            <div style={styles.dataWrapper}>
                <Paper
                    elevation={1}
                    style={{
                        padding: '4%',
                        border: '1px solid #fff',
                        height: '10%',
                        marginTop: '5%',
                    }}
                >
                    <Typography variant='h5' component='h3'>
                        <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No matching data available for the selected options.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    }
}

APIMSubscriptionsData.propTypes = {
    themeName: PropTypes.string.isRequired,
    chartData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
    maxCount: PropTypes.number.isRequired,
};
