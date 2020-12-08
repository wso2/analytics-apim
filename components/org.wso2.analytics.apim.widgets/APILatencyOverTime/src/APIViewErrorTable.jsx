/* eslint-disable require-jsdoc */
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
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import {
    VictoryLine,
    VictoryChart,
    VictoryTheme,
    VictoryStack,
    VictoryAxis,
    VictoryTooltip,
    VictoryLabel,
    VictoryScatter,
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
    root: {
        display: 'flex',
    },
    formControl: {
        margin: 2,
    },
});

const chartStyle = {
    hideAxis: {
        grid: { stroke: 'transparent' },
        axis: { stroke: 'transparent' },
        ticks: { stroke: 'transparent' },
        tickLabels: { fill: 'transparent' },
    },
};

const colorScale = ['tomato', 'magenta', 'gold', 'green', 'blue', 'red'];

class APIViewErrorTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            miscellaneousSelected: true,
            backendSelected: true,
            securitySelected: true,
            throttleSelected: true,
            requestMedSelected: true,
            responseMedSelected: true,
        };
        this.handleMiscellaneousSelectChange = this.handleMiscellaneousSelectChange.bind(this);
        this.handleBackendSelectChange = this.handleBackendSelectChange.bind(this);
        this.handleSecuritySelectChange = this.handleSecuritySelectChange.bind(this);
        this.handleThrottlingSelectChange = this.handleThrottlingSelectChange.bind(this);
        this.handleRequestMedSelectChange = this.handleRequestMedSelectChange.bind(this);
        this.handleResponseMedSelectChange = this.handleResponseMedSelectChange.bind(this);
        this.getPieChartForAPI = this.getPieChartForAPI.bind(this);
        this.getMaxYAxisValue = this.getMaxYAxisValue.bind(this);
        this.searchForMaxYValue = this.searchForMaxYValue.bind(this);

        const { themeName } = this.props;
        this.styles = {
            dataWrapper: {
                height: '75%',
                paddingTop: 35,
                margin: 'auto',
                width: '90%',
            },
            paper: {
                background: themeName === 'dark' ? '#152638' : '#E8E8E8',
                padding: '4%',
            },
        };
    }

    getPieChartForAPI() {
        const { perValue } = this.props;
        let { data } = this.props;
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
        } else {
            label = 'Time';
        }
        data = data.map((item) => {
            item.from = Moment(item.AGG_TIMESTAMP).format(timeFormat);
            item.to = Moment(item.AGG_TIMESTAMP).add(1, unit).format(timeFormat);
            item.miscellaneous = item.responseTime - (item.backendLatency + item.securityLatency
                + item.throttlingLatency + item.requestMedLat + item.responseMedLat);
            return item;
        });

        const {
            miscellaneousSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
        } = this.state;
        const maxY = this.getMaxYAxisValue(data);
        return (
            <div>
                <VictoryChart
                    domain={{ y: [0, maxY] }}
                    responsive={false}
                    domainPadding={{ x: [20, 20] }}
                    padding={{
                        top: 50, bottom: 100, right: 50, left: 50,
                    }}
                    theme={VictoryTheme.material}
                    height={400}
                    width={800}
                >
                    <VictoryAxis
                        label={label.toUpperCase()}
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
                        label={() => 'Latency Time (ms)'.toUpperCase()}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { strokeDasharray: '10, 5', strokeWidth: 0.5, strokeOpacity: 0.3 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />
                    <VictoryStack>
                        {this.renderLineAndScatter(backendSelected, data, colorScale[0], 'backendLatency',
                            'Backend latency')}
                        {this.renderLineAndScatter(securitySelected, data, colorScale[1], 'securityLatency',
                            'Security latency')}
                        {this.renderLineAndScatter(throttleSelected, data, colorScale[2], 'throttlingLatency',
                            'Throttling latency')}
                        {this.renderLineAndScatter(requestMedSelected, data, colorScale[3], 'requestMedLat',
                            'Request Mediation latency')}
                        {this.renderLineAndScatter(responseMedSelected, data, colorScale[4], 'responseMedLat',
                            'Response Mediation latency')}
                        {this.renderLineAndScatter(miscellaneousSelected, data, colorScale[5], 'miscellaneous',
                            'Miscellaneous latency')}
                    </VictoryStack>
                </VictoryChart>

            </div>
        );
    }

    getMaxYAxisValue(data) {
        const {
            miscellaneousSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
        } = this.state;
        let maxYValue = 0;
        if (miscellaneousSelected) {
            maxYValue = this.searchForMaxYValue(data, 'miscellaneous', maxYValue);
        }
        if (backendSelected) {
            maxYValue = this.searchForMaxYValue(data, 'backendLatency', maxYValue);
        }
        if (securitySelected) {
            maxYValue = this.searchForMaxYValue(data, 'securityLatency', maxYValue);
        }
        if (throttleSelected) {
            maxYValue = this.searchForMaxYValue(data, 'throttlingLatency', maxYValue);
        }
        if (requestMedSelected) {
            maxYValue = this.searchForMaxYValue(data, 'requestMedLat', maxYValue);
        }
        if (responseMedSelected) {
            maxYValue = this.searchForMaxYValue(data, 'responseMedLat', maxYValue);
        }
        if (maxYValue === 0) {
            maxYValue = 10;
        }
        return maxYValue;
    }

    searchForMaxYValue(data, columnName, maxYValue) {
        data.forEach((item) => {
            if (item[columnName] > maxYValue) {
                maxYValue = item[columnName];
            }
        });
        return maxYValue;
    }

    handleMiscellaneousSelectChange(event) {
        this.setState({
            miscellaneousSelected: event.target.checked,
        });
    }

    handleBackendSelectChange(event) {
        this.setState({
            backendSelected: event.target.checked,
        });
    }

    handleSecuritySelectChange(event) {
        this.setState({
            securitySelected: event.target.checked,
        });
    }

    handleThrottlingSelectChange(event) {
        this.setState({
            throttleSelected: event.target.checked,
        });
    }

    handleRequestMedSelectChange(event) {
        this.setState({
            requestMedSelected: event.target.checked,
        });
    }

    handleResponseMedSelectChange(event) {
        this.setState({
            responseMedSelected: event.target.checked,
        });
    }

    renderLineAndScatter(enabled, data, color, y, label) {
        const barRatio = 0.2;
        const strokeWidth = 1;
        if (!enabled) {
            return null;
        }
        return (
            <VictoryChart>
                <VictoryAxis style={chartStyle.hideAxis} />
                <VictoryAxis style={chartStyle.hideAxis} />
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
                            'Latency: ' + row[y]],
                    }))}
                    x={d => d.AGG_TIMESTAMP}
                    y={y}
                    labelComponent={<VictoryTooltip />}
                />
            </VictoryChart>
        );
    }

    render() {
        const { data } = this.props;
        const {
            miscellaneousSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
        } = this.state;
        const checkBoxData = [
            {
                selected: backendSelected,
                name: 'Backend Latency',
                onChange: this.handleBackendSelectChange,
                color: colorScale[0],
            },
            {
                selected: securitySelected,
                name: 'Security Latency',
                onChange: this.handleSecuritySelectChange,
                color: colorScale[1],
            },
            {
                selected: throttleSelected,
                name: 'Throttling Latency',
                onChange: this.handleThrottlingSelectChange,
                color: colorScale[2],
            },
            {
                selected: requestMedSelected,
                name: 'Request Mediation Latency',
                onChange: this.handleRequestMedSelectChange,
                color: colorScale[3],
            },
            {
                selected: responseMedSelected,
                name: 'Response Mediation Latency',
                onChange: this.handleResponseMedSelectChange,
                color: colorScale[4],
            },
            {
                selected: miscellaneousSelected,
                name: 'Miscellaneous',
                onChange: this.handleMiscellaneousSelectChange,
                color: colorScale[5],
            },
        ];

        if (data.length === 0) {
            return (
                <div style={this.styles.dataWrapper}>
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
                                defaultMessage={'No matching data available for the '
                                + 'selected options.'}
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
};

export default withStyles(styles)(APIViewErrorTable);
