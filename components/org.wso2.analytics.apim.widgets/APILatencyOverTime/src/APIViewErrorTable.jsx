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
    VictoryLine,
    VictoryChart,
    VictoryTheme,
    VictoryAxis,
    VictoryTooltip,
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
    root: {
        display: 'flex',
    },
    formControl: {
        margin: 2,
    },
});

const colorScale = ['tomato', 'orange', 'gold', 'green', 'blue', 'red'];

class APIViewErrorTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            responseSelected: true,
            backendSelected: true,
            securitySelected: true,
            throttleSelected: true,
            requestMedSelected: true,
            responseMedSelected: true,
        };
        this.handleResponseSelectChange = this.handleResponseSelectChange.bind(this);
        this.handleBackendSelectChange = this.handleBackendSelectChange.bind(this);
        this.handleSecuritySelectChange = this.handleSecuritySelectChange.bind(this);
        this.handleThrottlingSelectChange = this.handleThrottlingSelectChange.bind(this);
        this.handleRequestMedSelectChange = this.handleRequestMedSelectChange.bind(this);
        this.handleResponseMedSelectChange = this.handleResponseMedSelectChange.bind(this);
        this.getPieChartForAPI = this.getPieChartForAPI.bind(this);
    }

    getPieChartForAPI() {
        const timeFormat = 'DD/MM, HH:mm:ss';
        const { data } = this.props;
        const {
            responseSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
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
                        label={() => 'Latency Time (ms)'}
                        style={{
                            axis: { stroke: '#756f6a' },
                            axisLabel: { fontSize: 15, padding: 30 },
                            grid: { stroke: () => 0 },
                            ticks: { stroke: 'grey', size: 5 },
                            tickLabels: { fontSize: 9, padding: 5 },
                        }}
                    />

                    { responseSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[0], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Response latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.responseTime],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.responseTime}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                    { backendSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[1], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Backend latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.backendLatency],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.backendLatency}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                    { securitySelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[2], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Security latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.securityLatency],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.securityLatency}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                    { throttleSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[3], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Throttling latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.throttlingLatency],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.throttlingLatency}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                    { requestMedSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[4], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Request Mediation latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.requestMedLat],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.requestMedLat}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                    { responseMedSelected && (
                        <VictoryLine
                            style={{ data: { stroke: colorScale[5], strokeWidth } }}
                            alignment='start'
                            barRatio={0.5}
                            data={data.map(row => ({
                                ...row,
                                label: ['Response Mediation latency', Moment(row.AGG_TIMESTAMP).format(timeFormat),
                                    row.responseMedLat],
                            }))}
                            x={d => d.AGG_TIMESTAMP + ''}
                            y={d => d.responseMedLat}
                            labelComponent={<VictoryTooltip />}
                        />
                    ) }
                </VictoryChart>

            </div>
        );
    }

    handleResponseSelectChange(event) {
        this.setState({
            responseSelected: event.target.checked,
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


    render() {
        const {
            responseSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
        } = this.state;
        const checkBoxData = [
            {
                selected: responseSelected,
                name: 'Response Latency',
                onChange: this.handleResponseSelectChange,
                color: colorScale[0],
            },
            {
                selected: backendSelected,
                name: 'Backend Latency',
                onChange: this.handleBackendSelectChange,
                color: colorScale[1],
            },
            {
                selected: securitySelected,
                name: 'Security Latency',
                onChange: this.handleSecuritySelectChange,
                color: colorScale[2],
            },
            {
                selected: throttleSelected,
                name: 'Throttling Latency',
                onChange: this.handleThrottlingSelectChange,
                color: colorScale[3],
            },
            {
                selected: requestMedSelected,
                name: 'Request Mediation Latency',
                onChange: this.handleRequestMedSelectChange,
                color: colorScale[4],
            },
            {
                selected: responseMedSelected,
                name: 'Response Mediation Latency',
                onChange: this.handleResponseMedSelectChange,
                color: colorScale[5],
            },
        ];
        const { data, themeName } = this.props;
        const styles = {
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
        if (data.length === 0) {
            return (
                <div style={styles.dataWrapper}>
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
