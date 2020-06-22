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
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import PropTypes from 'prop-types';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Radio from '@material-ui/core/Radio';
import TextField from '@material-ui/core/TextField';
import { FormattedMessage } from 'react-intl';
import { ViewTypeEnum } from '../../AppAndAPIErrorTable/src/Constants';
import SummaryPieChart from './SummaryPieChart';


function ErrorsSummaryChart(props) {
    const {
        totalRequestCounts, data4XX, total4XX, data5XX, total5XX, dataFaulty, totalFaulty,
        dataThrottled, totalThrottled, handleViewChange, handleLimitChange, viewType, selectedLimit, themeName, height,
        publishSelectedData, loading4xx, loading5xx, loadingFaulty, loadingThrottled,
    } = props;

    let viewTypeName;
    if (viewType === ViewTypeEnum.API) {
        viewTypeName = 'APIs';
    }
    if (viewType === ViewTypeEnum.APP) {
        viewTypeName = 'Applications';
    }

    const classes = {
        table: {
            minWidth: 650,
            maxWidth: 650,
            marginBottom: 50,
            height,
        },
        formControl: {
            minWidth: 120,
        },
        root: {
            backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
            height,
        },
        lastCell: {
            'padding-right': '56px',
        },
    };

    return (
        <div style={classes.root}>
            <Table className={classes.table}>
                <TableBody>
                    <TableRow>
                        <FormControl className={classes.formControl}>
                            <RadioGroup
                                row
                                aria-label='viewType'
                                name='view'
                                value={viewType}
                                onChange={handleViewChange}
                            >
                                <FormControlLabel
                                    value={ViewTypeEnum.APP}
                                    control={<Radio />}
                                    label={<FormattedMessage id='view.app' defaultMessage='By Applications' />}
                                />
                                <FormControlLabel
                                    value={ViewTypeEnum.API}
                                    control={<Radio />}
                                    label={<FormattedMessage id='view.api' defaultMessage='By APIs' />}
                                />
                            </RadioGroup>
                        </FormControl>
                    </TableRow>
                    <TableRow>
                        <FormControl className={classes.formControl}>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit' />}
                                value={selectedLimit}
                                onChange={handleLimitChange}
                                type='number'
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </FormControl>
                    </TableRow>
                    <TableRow style={{ height: '70%' }}>
                        <TableCell align='right' width='25%'>
                            <SummaryPieChart
                                heading={'4xx errors by ' + viewTypeName}
                                data={data4XX}
                                totalErrors={total4XX}
                                totalRequestCounts={totalRequestCounts}
                                publishSelectedData={publishSelectedData}
                                viewType={viewType}
                                errorType='4xx'
                                height
                                loading={loading4xx}
                                themeName={themeName}
                            />
                        </TableCell>
                        <TableCell align='right' width='25%'>
                            <SummaryPieChart
                                heading={'5xx errors by ' + viewTypeName}
                                data={data5XX}
                                totalErrors={total5XX}
                                totalRequestCounts={totalRequestCounts}
                                publishSelectedData={publishSelectedData}
                                viewType={viewType}
                                errorType='5xx'
                                height
                                loading={loading5xx}
                                themeName={themeName}
                            />
                        </TableCell>
                        <TableCell align='right' width='25%'>
                            <SummaryPieChart
                                heading={'Faulty summary by ' + viewTypeName}
                                data={dataFaulty}
                                totalErrors={totalFaulty}
                                totalRequestCounts={totalRequestCounts}
                                publishSelectedData={publishSelectedData}
                                viewType={viewType}
                                errorType='faulty'
                                height
                                loading={loadingFaulty}
                                themeName={themeName}
                            />
                        </TableCell>
                        <TableCell style={classes.lastCell} align='right' width='25%'>
                            <SummaryPieChart
                                heading={'Throttled summary by ' + viewTypeName}
                                data={dataThrottled}
                                totalErrors={totalThrottled}
                                totalRequestCounts={totalRequestCounts}
                                publishSelectedData={publishSelectedData}
                                viewType={viewType}
                                errorType='throttled'
                                height
                                loading={loadingThrottled}
                                themeName={themeName}
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

ErrorsSummaryChart.propTypes = {
    data4XX: PropTypes.instanceOf(Object).isRequired,
    data5XX: PropTypes.instanceOf(Object).isRequired,
    dataFaulty: PropTypes.instanceOf(Object).isRequired,
    dataThrottled: PropTypes.instanceOf(Object).isRequired,
    total4XX: PropTypes.number.isRequired,
    total5XX: PropTypes.number.isRequired,
    totalFaulty: PropTypes.number.isRequired,
    totalThrottled: PropTypes.number.isRequired,
    totalRequestCounts: PropTypes.number.isRequired,
    handleViewChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    publishSelectedData: PropTypes.func.isRequired,
    viewType: PropTypes.string.isRequired,
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    loading4xx: PropTypes.bool.isRequired,
    loading5xx: PropTypes.bool.isRequired,
    loadingFaulty: PropTypes.bool.isRequired,
    loadingThrottled: PropTypes.bool.isRequired,
    selectedLimit: PropTypes.number.isRequired,
};

export default ErrorsSummaryChart;
