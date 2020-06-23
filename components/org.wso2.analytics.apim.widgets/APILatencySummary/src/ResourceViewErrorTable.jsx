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
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import {
    VictoryBar,
    VictoryChart,
    VictoryTheme,
    VictoryStack,
    VictoryAxis,
    VictoryTooltip,
    VictoryClipContainer,
    VictoryLabel,
} from 'victory';
import { FormattedMessage } from 'react-intl';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

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

    getPieChartForAPI() {
        const { data, handleOnClick } = this.props;
        const {
            responseSelected, backendSelected, securitySelected, throttleSelected,
            requestMedSelected, responseMedSelected,
        } = this.state;
        const barRatio = 0.2;
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
                    // style={{ parent: { maxWidth: 800 } }}
                    // scale={{ x: 20 }}
                >
                    <VictoryAxis
                        label={() => 'API Operation'}
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

                    <VictoryStack>
                        { responseSelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[0] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Response Latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.responseTime],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.responseTime}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                        { backendSelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[1] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Backend latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.backendLatency],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.backendLatency}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                        { securitySelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[2] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Security latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.securityLatency],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.securityLatency}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                        { throttleSelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[3] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Throttling latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.throttlingLatency],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.throttlingLatency}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                        { requestMedSelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[4] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Request Mediation latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.requestMedLat],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.requestMedLat}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                        { responseMedSelected && (
                            <VictoryBar
                                style={{ data: { fill: colorScale[5] } }}
                                alignment='start'
                                barRatio={barRatio}
                                data={data.map(row => ({
                                    ...row,
                                    label: ['Response Mediation latency',
                                        'API: ' + row.apiName,
                                        'Version: ' + row.apiVersion,
                                        'Operation: ' + row.apiResourceTemplate + ' ( ' + row.apiMethod + ' )',
                                        'Max Latency: ' + row.responseMedLat],
                                }))}
                                x={
                                    d => d.apiName + ':' + d.apiVersion + ':'
                                        + d.apiResourceTemplate + ' ( ' + d.apiMethod + ' )'
                                }
                                y={d => d.responseMedLat}
                                labelComponent={<VictoryTooltip />}
                                groupComponent={<VictoryClipContainer clipId={0} />}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onClick: (e) => {
                                                return [{
                                                    mutation: (val) => {
                                                        handleOnClick(e, val.datum);
                                                    },
                                                }];
                                            },
                                        },
                                    },
                                ]}
                            />
                        )}
                    </VictoryStack>
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
        const { data } = this.props;
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
    handleOnClick: PropTypes.func.isRequired,
    themeName: PropTypes.string.isRequired,
};

export default withStyles(styles)(APIViewErrorTable);
