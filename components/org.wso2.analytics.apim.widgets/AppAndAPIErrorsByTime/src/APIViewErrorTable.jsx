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
    VictoryScatter,
    VictoryGroup,

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
        this.renderLineAndScatter = this.renderLineAndScatter.bind(this);

        const { themeName } = this.props;
        this.styles = {
            paper: {
                background: themeName === 'dark' ? '#152638' : '#E8E8E8',
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
        const { perValue } = this.props;
        let { data } = this.props;
        const {
            successSelected, _4xxSelected, _5xxSelected, faultySelected, throttleSelected,
        } = this.state;
        const timeFormat = 'MMM DD, YYYY hh:mm:ss A';
        let unit;
        let label;
        if (perValue === 'day') {
            unit = 'days';
            label = 'Time (Day)';
        } else if (perValue === 'hour') {
            unit = 'hour';
            label = 'Time (Hour)';
        } else if (perValue === 'minute') {
            unit = 'minutes';
            label = 'Time (Minute)';
        } else if (perValue === 'second') {
            unit = 'seconds';
            label = 'Time (Second)';
        } else if (perValue === 'month') {
            unit = 'months';
            label = 'Time (Month)';
        } else if (perValue === 'year') {
            unit = 'years';
            label = 'Time (Year)';
        }

        data = data.map((item) => {
            item.from = Moment(item.AGG_TIMESTAMP).format(timeFormat);
            item.to = Moment(item.AGG_TIMESTAMP).add(1, unit).format(timeFormat);
            return item;
        });
        return (
            <div>
                <VictoryChart
                    responsive={false}
                    domainPadding={{ x: [20, 20] }}
                    theme={VictoryTheme.material}
                    height={400}
                    width={800}
                    padding={{
                        top: 50, bottom: 100, right: 50, left: 50,
                    }}
                >
                    <VictoryAxi
                        label={label}
                        tickFormat={(time) => {
                            const moment = Moment(Number(time));
                            return moment.format(timeFormat);
                        }}
                        tickCount={10}
                        tickLabelComponent={<VictoryLabel angle={45} />}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15 },
                            grid: { stroke: () => 0 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, textAnchor: 'start' },
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        label={() => 'Error count'.toUpperCase()}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { strokeDasharray: '10, 5', strokeWidth: 0.5, strokeOpacity: 0.3 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />
                    {this.renderLineAndScatter(successSelected, data, colorScale[0], 'responseCount', 'Response Hit')}
                    {this.renderLineAndScatter(_4xxSelected, data, colorScale[1], '_4xx', '4xx Errors')}
                    {this.renderLineAndScatter(_5xxSelected, data, colorScale[2], '_5xx', '5xx Errors')}
                    {this.renderLineAndScatter(faultySelected, data, colorScale[3], 'faultCount', 'Fault Errors')}
                    {this.renderLineAndScatter(throttleSelected, data, colorScale[4],
                        'throttledCount', 'Throttled Errors')}
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

    renderLineAndScatter(enabled, data, color, y, label) {
        const barRatio = 0.2;
        const strokeWidth = 1;
        if (!enabled) {
            return null;
        }
        return (
            <VictoryGroup>
                <VictoryLine
                    style={{ data: { stroke: color, strokeWidth } }}
                    alignment='start'
                    barRatio={barRatio}
                    data={data}
                    x={d => d.AGG_TIMESTAMP}
                    y={y}
                />
                <VictoryScatter
                    style={{ data: { fill: color } }}
                    size={3}
                    data={data.map(row => ({
                        ...row,
                        label: [label, 'From: ' + row.from, 'To: ' + row.to,
                            'Count: ' + row[y]],
                    }))}
                    x={d => d.AGG_TIMESTAMP}
                    y={y}
                    labelComponent={<VictoryTooltip />}
                />
            </VictoryGroup>
        );
    }

    render() {
        const { data } = this.props;
        const {
            successSelected, _4xxSelected, _5xxSelected, faultySelected, throttleSelected,
        } = this.state;
        const checkBoxData = [
            {
                selected: successSelected,
                name: 'Response Hit',
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
    themeName: PropTypes.string.isRequired,
    perValue: PropTypes.string.isRequired,
};

export default APIViewErrorTable;
