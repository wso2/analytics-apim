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
import TableHead from '@material-ui/core/TableHead';
import Paper from '@material-ui/core/Paper';
import { Divider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { CustomTableToolbar } from '@analytics-apim/common-lib';
import TablePagination from '@material-ui/core/TablePagination';
import MenuItem from '@material-ui/core/MenuItem';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import { ViewTypeEnum, ValueFormatType } from './Constants';

const styles = theme => ({
    table: {
        minWidth: 200,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
    hover: {
        cursor: 'pointer',
    },
    header: {
        height: '24px',
    },
    headerCell: {
        paddingTop: '4px',
        paddingBottom: '4px',
    },
    border: {
        borderLeft: '1px solid rgba(81, 81, 81, 1)',
        borderRight: '1px solid rgba(81, 81, 81, 1)',
        paddingTop: '8px',
        paddingBottom: '8px',
    },
    borderRight: {

    },
    root: {
        width: '100%',
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    loadingIcon: {
        margin: 'auto',
        display: 'block',
    },
    paginationRoot: {
        color: theme.palette.text.secondary,
        fontSize: theme.typography.pxToRem(12),
        '&:last-child': {
            padding: 0,
        },
    },
    paginationToolbar: {
        height: 56,
        minHeight: 56,
        padding: '0 5%',
    },
    paginationCaption: {
        flexShrink: 0,
    },
    paginationSelectRoot: {
        marginRight: '10px',
    },
    paginationSelect: {
        paddingLeft: 8,
        paddingRight: 16,
    },
    paginationSelectIcon: {
        top: 1,
    },
    paginationInput: {
        color: 'inherit',
        fontSize: 'inherit',
        flexShrink: 0,
    },
    paginationMenuItem: {
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    paginationActions: {
        marginLeft: 0,
    },
    statusCell: {
        display: 'flex',
    },
    statusContainer: {
        paddingTop: 5,
        paddingLeft: 10,
    },
});

class ResourceViewErrorTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tableData: [],
            page: 0,
            rowsPerPage: 5,
            expanded: false,
            filterColumn: 'apiname',
            query: '',
        };

        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
        this.getTableHeadRowsForAPI = this.getTableHeadRowsForAPI.bind(this);
        this.handleExpandClick = this.getTableHeadRowsForAPI.bind(this);
        this.handleColumnSelect = this.getTableHeadRowsForAPI.bind(this);
        this.handleQueryChange = this.getTableHeadRowsForAPI.bind(this);
        this.getColumnList = this.getColumnList.bind(this);
        this.summarizeData = this.summarizeData.bind(this);
        this.processTableData = this.processTableData.bind(this);
    }

    getTableHeadRowsForAPI() {
        const {
            viewType, classes, data, handleDrillDownClick, username, intl, timeTo, timeFrom,
        } = this.props;
        const {
            query, expanded, filterColumn, rowsPerPage, page,
        } = this.state;
        this.state.tableData = data;
        const { tableData } = this.state;
        const summarizedData = this.summarizeData();
        const strColumns = this.getColumnList();
        const title = intl.formatMessage({ id: 'widget.heading', defaultMessage: 'ERROR SUMMARY' });
        const menuItems = [
            <MenuItem value='apiname'>
                <FormattedMessage id='table.heading.apiname' defaultMessage='API NAME' />
            </MenuItem>,
        ];

        return (
            <Paper className={classes.root}>
                <CustomTableToolbar
                    expanded={expanded}
                    filterColumn={filterColumn}
                    query={query}
                    handleExpandClick={this.handleExpandClick}
                    handleColumnSelect={this.handleColumnSelect}
                    handleQueryChange={this.handleQueryChange}
                    menuItems={menuItems}
                    title={title}
                    data={summarizedData}
                    strColumns={strColumns}
                    username={username}
                    timeTo={timeTo}
                    timeFrom={timeFrom}
                />
                <div className={classes.tableWrapper}>
                    <Table className={styles.table} aria-label='simple table'>
                        <TableHead>
                            <TableRow className={classes.header}>
                                {viewType === ViewTypeEnum.APP ? (
                                    <TableCell rowSpan={2} className={classes.headerCell}>
                                        <FormattedMessage id='table.column.app' defaultMessage='Application' />
                                    </TableCell>
                                ) : ''}
                                <TableCell rowSpan={2} className={classes.headerCell}>
                                    <FormattedMessage id='table.column.operation' defaultMessage='Operation' />
                                </TableCell>
                                <TableCell align='center' colSpan={4} className={classes.border}>
                                    <FormattedMessage id='table.column.responseHit' defaultMessage='Response Hit' />
                                </TableCell>
                                <TableCell rowSpan={2} className={classes.headerCell}>
                                    <FormattedMessage id='table.column.totalFaulty' defaultMessage='Faulty' />
                                </TableCell>
                                <TableCell rowSpan={2} className={classes.headerCell}>
                                    <FormattedMessage
                                        id='table.column.totalThrottled'
                                        defaultMessage='Throttled'
                                    />
                                </TableCell>
                                <TableCell rowSpan={2} className={classes.headerCell}>
                                    <FormattedMessage id='table.column.totalRequests' defaultMessage='Total Requests' />
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.header}>
                                <TableCell className={classes.headerCell}>
                                    <FormattedMessage id='table.column.2xx' defaultMessage='2xx' />
                                </TableCell>
                                <TableCell className={classes.headerCell}>
                                    <FormattedMessage id='table.column.4xx' defaultMessage='4xx' />
                                </TableCell>
                                <TableCell className={classes.headerCell}>
                                    <FormattedMessage id='table.column.5xx' defaultMessage='5xx' />
                                </TableCell>
                                <TableCell className={classes.headerCell}>
                                    <FormattedMessage id='table.column.other' defaultMessage='Other' />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => {
                                    const {
                                        applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                                    } = row;
                                    const rowSummary = this.processTableData(row);
                                    return (
                                        <TableRow
                                            hover
                                            key={{ apiResourceTemplate, apiMethod }}
                                            onClick={() => handleDrillDownClick({
                                                applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                                            })}
                                            className={classes.hover}
                                        >
                                            {viewType === ViewTypeEnum.APP ? (
                                                <TableCell>
                                                    {rowSummary.appName}
                                                </TableCell>
                                            ) : ''}
                                            <TableCell>{rowSummary.operation}</TableCell>
                                            <TableCell>{rowSummary._2xx}</TableCell>
                                            <TableCell>{rowSummary._4xx}</TableCell>
                                            <TableCell>{rowSummary._5xx}</TableCell>
                                            <TableCell>{rowSummary.other}</TableCell>
                                            <TableCell>{rowSummary.faultCount}</TableCell>
                                            <TableCell>{rowSummary.throttledCount}</TableCell>
                                            <TableCell>{rowSummary.totalRequests}</TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
                    component='div'
                    count={tableData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    backIconButtonProps={{
                        'aria-label': 'Previous Page',
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'Next Page',
                    }}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                    classes={{
                        root: classes.paginationRoot,
                        toolbar: classes.paginationToolbar,
                        caption: classes.paginationCaption,
                        selectRoot: classes.paginationSelectRoot,
                        select: classes.paginationSelect,
                        selectIcon: classes.paginationSelectIcon,
                        input: classes.paginationInput,
                        menuItem: classes.paginationMenuItem,
                        actions: classes.paginationActions,
                    }}
                />
            </Paper>
        );
    }

    getColumnList = () => {
        const { viewType, intl } = this.props;
        const columns = [
            { id: 'table.column.operation', label: 'Operation' },
            { id: 'table.column.2xx', label: '2xx' },
            { id: 'table.column.4xx', label: '4xx' },
            { id: 'table.column.5xx', label: '5xx' },
            { id: 'table.column.other', label: 'Other' },
            { id: 'table.column.totalFaulty', label: 'Faulty ' },
            { id: 'table.column.totalThrottled', label: 'Throttled' },
            { id: 'table.column.totalRequests', label: 'Total Requests' }];

        if (viewType === ViewTypeEnum.APP) {
            columns.unshift({ id: 'table.column.app', label: 'Application' });
        }
        return columns.map((colObj) => {
            return intl.formatMessage({ id: colObj.id, defaultMessage: colObj.label });
        });
    };

    handleChangePage = (event, page) => {
        this.setState({ page });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({ rowsPerPage: event.target.value });
    };

    handleExpandClick = () => {
        this.setState(state => ({ expanded: !state.expanded }));
    };

    handleColumnSelect = (event) => {
        this.setState({ filterColumn: event.target.value });
    };

    handleQueryChange = (event) => {
        this.setState({ query: event.target.value });
    };

    summarizeData = () => {
        const { data } = this.props;
        const { rowsPerPage, page } = this.state;

        return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row) => {
                return this.processTableData(row);
            });
    };

    processTableData = (row) => {
        const { viewType, valueFormatType } = this.props;
        const {
            applicationName, applicationOwner, apiResourceTemplate, apiMethod,
            responseCount,
        } = row;
        let {
            _2xx, _4xx, _5xx, faultCount, throttledCount,
        } = row;
        const appName = applicationName + ' ( ' + applicationOwner + ' )';
        const operation = apiResourceTemplate + ' ( ' + apiMethod + ' )';
        let other = responseCount - (_2xx + _4xx + _5xx);
        const totalRequests = responseCount + faultCount + throttledCount;
        if (valueFormatType === ValueFormatType.PERCENT) {
            _2xx = ((_2xx * 100) / totalRequests).toFixed(2) + ' %';
            _4xx = ((_4xx * 100) / totalRequests).toFixed(2) + ' %';
            _5xx = ((_5xx * 100) / totalRequests).toFixed(2) + ' %';
            faultCount = ((faultCount * 100) / totalRequests).toFixed(2) + ' %';
            throttledCount = ((throttledCount * 100) / totalRequests).toFixed(2) + ' %';
            other = ((other * 100) / totalRequests).toFixed(2) + ' %';
        }
        const dataUnit = {};
        if (viewType === ViewTypeEnum.APP) {
            dataUnit.appName = appName;
        }
        dataUnit.operation = operation;
        dataUnit._2xx = _2xx;
        dataUnit._4xx = _4xx;
        dataUnit._5xx = _5xx;
        dataUnit.other = other;
        dataUnit.faultCount = faultCount;
        dataUnit.throttledCount = throttledCount;
        dataUnit.totalRequests = totalRequests;

        return dataUnit;
    };

    render() {
        return (
            <div component={Paper}>
                <Divider m={10} />
                {this.getTableHeadRowsForAPI()}
            </div>
        );
    }
}

ResourceViewErrorTable.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    viewType: PropTypes.string.isRequired,
    valueFormatType: PropTypes.string.isRequired,
    data: PropTypes.instanceOf(Object).isRequired,
    handleDrillDownClick: PropTypes.instanceOf(Object).isRequired,
    intl: intlShape.isRequired,
    username: PropTypes.string.isRequired,
};

export default withStyles(styles)(injectIntl(ResourceViewErrorTable));
