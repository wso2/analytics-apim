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
import { FormattedMessage } from 'react-intl';
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
    }

    getTableHeadRowsForAPI() {
        const {
            viewType, valueFormatType, classes, data, handleDrillDownClick,
        } = this.props;
        const {
            query, expanded, filterColumn, rowsPerPage, page,
        } = this.state;
        this.state.tableData = data;
        const { tableData } = this.state;
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
                />
                <div className={classes.tableWrapper}>
                    <Table className={styles.table} aria-label='simple table'>
                        <TableHead>
                            <TableRow className={classes.header}>
                                { viewType === ViewTypeEnum.APP ? (
                                    <TableCell rowSpan={2} className={classes.headerCell}>
                                        Application
                                    </TableCell>
                                ): '' }
                                <TableCell align='right' rowSpan={2} className={classes.headerCell}>
                                    Operation
                                </TableCell>
                                <TableCell align='center' colSpan={4} className={classes.border}>
                                    Response Hit
                                </TableCell>
                                <TableCell align='right' rowSpan={2} className={classes.headerCell}>
                                    Total Faulty
                                </TableCell>
                                <TableCell align='right' rowSpan={2} className={classes.headerCell}>
                                    Total Throttled
                                </TableCell>
                                <TableCell align='right' rowSpan={2} className={classes.headerCell}>
                                    Total Requests
                                </TableCell>
                            </TableRow>
                            <TableRow className={classes.header}>
                                <TableCell align='right' className={classes.headerCell}>4xx</TableCell>
                                <TableCell align='right' className={classes.headerCell}>5xx</TableCell>
                                <TableCell align='right' className={classes.headerCell}>Total Errors</TableCell>
                                <TableCell align='right' className={classes.headerCell}>Total Success</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => {
                                    const {
                                        applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                                    } = row;
                                    let {
                                        _4xx, _5xx, faultCount, throttledCount, successCount,
                                    } = row;
                                    const appName = applicationName + ' ( ' + applicationOwner + ' )';
                                    const operation = apiResourceTemplate + ' ( ' + apiMethod + ' )';
                                    let totalErrors = _4xx + _5xx;
                                    const totalRequests = successCount + faultCount + throttledCount;
                                    if (valueFormatType === ValueFormatType.PERCENT) {
                                        _4xx = ((_4xx * 100) / totalRequests).toFixed(2) + ' %';
                                        _5xx = ((_5xx * 100) / totalRequests).toFixed(2) + ' %';
                                        totalErrors = ((totalErrors * 100) / totalRequests).toFixed(2) + ' %';
                                        faultCount = ((faultCount * 100) / totalRequests).toFixed(2) + ' %';
                                        throttledCount = ((throttledCount * 100) / totalRequests).toFixed(2) + ' %';
                                        successCount = ((successCount * 100) / totalRequests).toFixed(2) + ' %';
                                    }
                                    return (
                                        <TableRow
                                            hover
                                            key={{ apiResourceTemplate, apiMethod }}
                                            onClick={() => handleDrillDownClick({
                                                applicationName, applicationOwner, apiResourceTemplate, apiMethod
                                            })}
                                            className={classes.hover}
                                        >
                                            { viewType === ViewTypeEnum.APP ? (
                                                <TableCell>
                                                    {appName}
                                                </TableCell>
                                            ) : '' }
                                            <TableCell align='right'>{operation}</TableCell>
                                            <TableCell align='right'>{_4xx}</TableCell>
                                            <TableCell align='right'>{_5xx}</TableCell>
                                            <TableCell align='right'>{totalErrors}</TableCell>
                                            <TableCell align='right'>{successCount}</TableCell>
                                            <TableCell align='right'>{faultCount}</TableCell>
                                            <TableCell align='right'>{throttledCount}</TableCell>
                                            <TableCell align='right'>{totalRequests}</TableCell>
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

    render() {
        return (
            <div component={Paper}>
                <Divider m={10} />
                { this.getTableHeadRowsForAPI() }
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
};

export default withStyles(styles)(ResourceViewErrorTable);
