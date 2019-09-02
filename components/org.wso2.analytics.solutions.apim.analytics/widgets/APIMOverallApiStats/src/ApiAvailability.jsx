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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { VictoryPie, VictoryLegend, VictoryTooltip } from 'victory';
import sumBy from 'lodash/sumBy';

/**
 * React Component for Api Availability Chart
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Availability Chart
 */
export default function ApiAvailability(props) {
    const { availableApiData, legendData } = props;
    const styles = {
        dataWrapper: {
            height: '75%',
        },
        paper: {
            padding: '4%',
            border: '1px solid #fff',
            height: '10%',
            marginTop: '5%',
        },
        chartTitle: {
            height: '15%',
            display: 'flex',
            marginRight: 'auto',
        },
    };
    if (availableApiData.length === 0) {
        return (
            <div style={styles.dataWrapper}>
                <Paper
                    elevation={1}
                    style={styles.paper}
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
    return (
        <div>
            <div style={styles.chartTitle}>
                <FormattedMessage id='chart.heading' defaultMessage='API AVAILABILITY :' />
            </div>
            <svg viewBox='0 0 600 400'>
                <VictoryPie
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
                            style={{ fill: '#fff', fontSize: 25 }}
                        />
                    )}
                    width={400}
                    height={400}
                    standalone={false}
                    padding={{
                        left: 50, bottom: 50, top: 50, right: 50,
                    }}
                    colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                    data={availableApiData}
                    x={0}
                    y={1}
                    labels={d => `${d[0]} : ${((d[1] / (sumBy(availableApiData, o => o[1]))) * 100).toFixed(2)}%`}
                />
                <VictoryLegend
                    standalone={false}
                    colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                    x={400}
                    y={20}
                    gutter={20}
                    rowGutter={{ top: 0, bottom: -10 }}
                    style={{
                        labels: {
                            fill: '#9e9e9e',
                            fontSize: 25,
                        },
                    }}
                    data={legendData}
                />
            </svg>
        </div>
    );
}

ApiAvailability.propTypes = {
    availableApiData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
};
