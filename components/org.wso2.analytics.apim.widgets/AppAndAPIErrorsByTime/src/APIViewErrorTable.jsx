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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import {
    VictoryBar,
    VictoryChart,
    VictoryTheme,
    VictoryStack,
    VictoryLegend,
    VictoryAxis,
    VictoryTooltip,
    VictoryClipContainer,
    VictoryLabel,
} from 'victory';
import Moment from 'moment';
import { FormattedMessage } from 'react-intl';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        minHeight: 400,
        marginBottom: 50,
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
});

class APIViewErrorTable extends React.Component {
    getPieChartForAPI() {
        const timeFormat = 'DD/MM, HH:mm:ss';
        const { data } = this.props;
        return (
            <div>
                <VictoryChart
                    responsive={false}
                    domainPadding={{ x: [20, 20] }}
                    theme={VictoryTheme.material}
                    height={300}
                    style={{ parent: { maxWidth: 800 } }}
                    // scale={{ x: 20 }}
                >
                    <VictoryLegend
                        x={100}
                        y={10}
                        // title='Error Type'
                        centerTitle
                        orientation='horizontal'
                        gutter={5}
                        style={{
                            // border: {stroke: 'black'},
                            labels: { fontSize: 6, fill: 'white' },
                            // title: {fontSize: 12},
                            // parent: {maxWidth: maxWidth + 100}
                        }}
                        // colorScale={['tomato', 'orange', 'gold', 'green', 'blue']}
                        data={[
                            { name: 'success', symbol: { fill: 'tomato' } },
                            { name: '4xx', symbol: { fill: 'orange' } },
                            { name: '5xx', symbol: { fill: 'gold' } },
                            { name: 'faulty', symbol: { fill: 'green' } },
                            { name: 'throttled', symbol: { fill: 'blue' } }]}
                        height={60}
                    />
                    <VictoryAxis
                        label={() => 'Time'}
                        tickFormat={(time) => {
                            const moment = Moment(Number(time));
                            return moment.format(timeFormat);
                        }}
                        tickLabelComponent={<VictoryLabel angle={45} />}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { stroke: () => 0 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        label={() => 'Error count'}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { stroke: () => 0 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />

                    <VictoryStack>
                        <VictoryBar
                            style={{ data: { fill: 'tomato' } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['success', Moment(row.AGG_TIMESTAMP).format('DD-MM, HH:mm:ss'),
                                    row.successCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='successCount'
                            labelComponent={<VictoryTooltip />}
                            groupComponent={<VictoryClipContainer clipId={0} />}
                        />
                        <VictoryBar
                            style={{ data: { fill: 'orange' } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['4xx errors', Moment(row.AGG_TIMESTAMP).format('DD-MM, HH:mm:ss'),
                                    row._4xx],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='_4xx'
                            labelComponent={<VictoryTooltip />}
                            groupComponent={<VictoryClipContainer clipId={0} />}
                        />
                        <VictoryBar
                            style={{ data: { fill: 'gold' } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['5xx errors', Moment(row.AGG_TIMESTAMP).format('DD-MM, HH:mm:ss'),
                                    row._5xx],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='_5xx'
                            labelComponent={<VictoryTooltip />}
                            groupComponent={<VictoryClipContainer clipId={0} />}
                        />
                        <VictoryBar
                            style={{ data: { fill: 'green' } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['fault errors', Moment(row.AGG_TIMESTAMP).format('DD-MM, HH:mm:ss'),
                                    row.faultCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='faultCount'
                            labelComponent={<VictoryTooltip />}
                            groupComponent={<VictoryClipContainer clipId={0} />}
                        />
                        <VictoryBar
                            style={{ data: { fill: 'blue' } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['throttled errors', Moment(row.AGG_TIMESTAMP).format('DD-MM, HH:mm:ss'),
                                    row.throttledCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='throttledCount'
                            labelComponent={<VictoryTooltip />}
                            groupComponent={<VictoryClipContainer clipId={0} />}
                        />
                    </VictoryStack>
                </VictoryChart>
            </div>
        );
    }

    render() {
        const { data } = this.props;
        return (
            <div component={Paper}>
                {data.length === 0
                    ? (
                        <Typography variant='h5' component='h3'>
                            <FormattedMessage
                                id='nodata.error.heading'
                                defaultMessage='No Data Available !'
                            />
                        </Typography>
                    )
                    : this.getPieChartForAPI()
                }
            </div>
        );
    }
}

APIViewErrorTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(APIViewErrorTable);
