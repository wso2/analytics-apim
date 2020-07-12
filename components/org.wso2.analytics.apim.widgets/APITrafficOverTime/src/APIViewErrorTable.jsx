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
    VictoryVoronoiContainer,
    VictoryChart,
    VictoryTheme,
    VictoryAxis,
    VictoryTooltip,
    VictoryLabel,
    VictoryStack,
    VictoryBar,
    VictoryLine,
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

const colorScale = ['#45b29d', '#b71c1c', '#ff9800'];
class APIViewErrorTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            successSelected: true,
            faultySelected: true,
            throttledSelected: true,
        };
        this.handleSuccessSelectChange = this.handleSuccessSelectChange.bind(this);
        this.handleFaultySelectChange = this.handleFaultySelectChange.bind(this);
        this.handleTrottledSelectChange = this.handleTrottledSelectChange.bind(this);
        this.getChartForAPI = this.getChartForAPI.bind(this);

        this.styles = {
            dataWrapper: {
                height: '75%',
                paddingTop: 35,
                margin: 'auto',
                width: '90%',
            },
            paper: {
                background: this.props.themeName === 'dark' ? '#152638' : '#E8E8E8',
                padding: '4%',
            },
        };
    }

    getChartForAPI() {
        const timeFormat = 'Y-m-d HH:MM:SS';
        const barRatio = 0.2;
        const barWidth = 15;
        const { data } = this.props;
        const {
            successSelected, faultySelected, throttledSelected,
        } = this.state;
        const strokeWidth = 1;
        return (
            <div>
                <VictoryChart
                    responsive={false}
                    domainPadding={{ x: [20, 20] }}
                    padding={{
                        top: 50, bottom: 50, right: 50, left: 50,
                    }}
                    theme={VictoryTheme.material}
                    height={400}
                    width={800}
                    containerComponent={
                        <VictoryVoronoiContainer />
                    }
                // style={{ parent: { maxWidth: 800 } }}
                // scale={{ x: 20 }}
                >
                    <VictoryAxis
                        label={() => 'Time'.toUpperCase()}
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
                        label={() => 'API Hits'.toUpperCase()}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { stroke: () => 0 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />
                    {successSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[0], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            barWidth={barWidth}
                            data={data.map(row => ({
                                ...row,
                                label: ['Success Count', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.responseCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP}
                            y={d => d.responseCount}
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    {faultySelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[1], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            barWidth={barWidth}
                            data={data.map(row => ({
                                ...row,
                                label: ['Faulty Count', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.faultCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP}
                            y={d => d.faultCount}
                            labelComponent={<VictoryTooltip />}
                        />
                    )}
                    {throttledSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[2], strokeWidth } }}
                            alignment='start'
                            barRatio={barRatio}
                            barWidth={barWidth}
                            data={data.map(row => ({
                                ...row,
                                label: ['Throttled Count', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.throttledCount],
                            }))}
                            x={d => d.AGG_TIMESTAMP}
                            y={d => d.throttledCount}
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

    handleFaultySelectChange(event) {
        this.setState({
            faultySelected: event.target.checked,
        });
    }

    handleTrottledSelectChange(event) {
        this.setState({
            throttledSelected: event.target.checked,
        });
    }

    render() {
        const {
            successSelected, faultySelected, throttledSelected,
        } = this.state;
        const checkBoxData = [
            {
                selected: successSelected,
                name: 'Success Count',
                onChange: this.handleSuccessSelectChange,
                color: colorScale[0],
            },
            {
                selected: faultySelected,
                name: 'Faulty Count',
                onChange: this.handleFaultySelectChange,
                color: colorScale[1],
            },
            {
                selected: throttledSelected,
                name: 'Throttled Count',
                onChange: this.handleTrottledSelectChange,
                color: colorScale[2],
            },
        ];
        const { data } = this.props;
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
                            {this.getChartForAPI()}
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
