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
    VictoryChart,
    VictoryTheme,
    VictoryAxis,
    VictoryTooltip,
    VictoryLabel,
    VictoryLine,
    VictoryVoronoiContainer,
} from 'victory';
import Moment from 'moment';
import { FormattedMessage } from 'react-intl';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

const colorScale = ['green', 'orange', 'gold', 'red', 'blue'];

class APIViewErrorTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            successSelected: true,
            _4xxSelected: true,
            _5xxSelected: true,
            faultySelected: true,
            throttleSelected: true,
        };
        this.handleSuccessSelectChange = this.handleSuccessSelectChange.bind(this);
        this.handle4XXSelectChange = this.handle4XXSelectChange.bind(this);
        this.handle5XXSelectChange = this.handle5XXSelectChange.bind(this);
        this.handleFaultySelectChange = this.handleFaultySelectChange.bind(this);
        this.handleThrottlingSelectChange = this.handleThrottlingSelectChange.bind(this);
        this.getPieChartForAPI = this.getPieChartForAPI.bind(this);

        this.styles = {
            paper: {
                background: this.props.themeName === 'dark' ? '#152638' : '#E8E8E8',
                padding: '4%',
            },
            paperWrapper: {
                height: '75%',
                paddingTop: 35,
                margin: 'auto',
                width: '90%',
            },
        };
    }

    getPieChartForAPI() {
        const timeFormat = 'YY/DD/MM, HH:mm:ss';
        const { data } = this.props;
        const {
            successSelected, _4xxSelected, _5xxSelected, faultySelected, throttleSelected,
        } = this.state;
        const barRatio = 0.2;
        const strokeWidth = 1;
        return (
            <div>
                <VictoryChart
                    responsive={false}
                    domainPadding={{ x: [20, 20] }}
                    theme={VictoryTheme.material}
                    height={400}
                    width={800}
                    // style={{ parent: { maxWidth: 800 } }}
                    // scale={{ x: 20 }}
                    padding={{
                        top: 50, bottom: 50, right: 50, left: 50,
                    }}
                    containerComponent={
                        <VictoryVoronoiContainer />
                    }
                >
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

                    { successSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[0], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            data={data.map(row => ({
                                ...row,
                                label: ['success', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.successCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='successCount'
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    { _4xxSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[1], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            data={data.map(row => ({
                                ...row,
                                label: ['4xx errors', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row._4xx],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='_4xx'
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    { _5xxSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[2], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            data={data.map(row => ({
                                ...row,
                                label: ['5xx errors', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row._5xx],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='_5xx'
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    { faultySelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[3], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            data={data.map(row => ({
                                ...row,
                                label: ['fault errors', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.faultCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='faultCount'
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    { throttleSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[4], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            data={data.map(row => ({
                                ...row,
                                label: ['throttled errors', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.throttledCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y='throttledCount'
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                </VictoryChart>
            </div>
        );
    }

    handleSuccessSelectChange(event) {
        this.setState({
            successSelected: event.target.checked,
        });
    }

    handle4XXSelectChange(event) {
        this.setState({
            _4xxSelected: event.target.checked,
        });
    }

    handle5XXSelectChange(event) {
        this.setState({
            _5xxSelected: event.target.checked,
        });
    }

    handleFaultySelectChange(event) {
        this.setState({
            faultySelected: event.target.checked,
        });
    }

    handleThrottlingSelectChange(event) {
        this.setState({
            throttleSelected: event.target.checked,
        });
    }

    render() {
        const { data } = this.props;
        const {
            successSelected, _4xxSelected, _5xxSelected, faultySelected, throttleSelected,
        } = this.state;
        const checkBoxData = [
            {
                selected: successSelected,
                name: 'Success Hits',
                onChange: this.handleSuccessSelectChange,
                color: colorScale[0],
            },
            {
                selected: _4xxSelected,
                name: '4XX Hits',
                onChange: this.handle4XXSelectChange,
                color: colorScale[1],
            },
            {
                selected: _5xxSelected,
                name: '5XX Hits',
                onChange: this.handle5XXSelectChange,
                color: colorScale[2],
            },
            {
                selected: faultySelected,
                name: 'Faulty Hits',
                onChange: this.handleFaultySelectChange,
                color: colorScale[3],
            },
            {
                selected: throttleSelected,
                name: 'Throttled Hits',
                onChange: this.handleThrottlingSelectChange,
                color: colorScale[4],
            },
        ];
        if (data.length === 0) {
            return (
                <div style={this.styles.paperWrapper}>
                    <Paper
                        elevation={1}
                        style={this.styles.paper}
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
                                defaultMessage='No data available for the selected options'
                            />
                        </Typography>
                    </Paper>
                </div>
            );
        }
        return (
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            { this.getPieChartForAPI() }
                        </TableCell>
                        <TableCell>
                            <FormGroup>
                                {checkBoxData.map((row) => {
                                    return (
                                        <FormControlLabel
                                            control={
                                                (
                                                    <Checkbox
                                                        checked={row.selected}
                                                        onChange={row.onChange}
                                                        inputProps={{ 'aria-label': 'primary checkbox' }}
                                                        name={row.name}
                                                        style={{ color: row.color }}
                                                    />
                                                )
                                            }
                                            label={row.name}
                                        />
                                    );
                                })}
                            </FormGroup>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }
}

APIViewErrorTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
};

export default APIViewErrorTable;
