/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import CustomTableHead from './CustomTableHead';
import CustomTableToolbar from './CustomTableToolbar';

/**
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @param {string} orderBy - column to sort table
 * @return {number}
 * */
function desc(a, b, orderBy) {
    let tempa = a[orderBy];
    let tempb = b[orderBy];

    if (typeof (tempa) === 'string') {
        tempa = tempa.toLowerCase();
        tempb = tempb.toLowerCase();
    }

    if (tempb < tempa) {
        return -1;
    }
    if (tempb > tempa) {
        return 1;
    }
    return 0;
}

/**
 * Stabilize the data set and sort the data fields
 * @param {object} array - data set
 * @param {object} cmp - method to sort
 * @return {object}
 * */
function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

/**
 * Set the value received from desc() according to 'order'
 * @param {string} order - desc or asc
 * @param {string} orderBy - column to sort table
 * @return {object}
 * */
function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const styles = theme => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    table: {
        minWidth: 200,
    },
    tableWrapper: {
        overflowX: 'auto',
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
        marginRight: 10,
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
    noDataMessage: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888888',
    },
    inProgress: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

/**
 * Tabular display of API usage of application data
 */
class CustomTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            page: 0,
            rowsPerPage: 5,
            orderBy: 'hits',
            order: 'desc',
            expanded: false,
            filterColumn: 'apiName',
            filterQuery: '',
            emptyRowHeight: 49,
        };
    }

    handleRequestSort = (event, property) => {
        const { order, orderBy } = this.state;
        let orderNew = 'desc';
        if (orderBy === property && order === 'desc') {
            orderNew = 'asc';
        }
        this.setState({ order: orderNew, orderBy: property });
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
        this.setState({ filterQuery: event.target.value });
    };

    /**
     * Render the Application Api Usage table
     * @return {ReactElement} customTable
     */
    render() {
        const { data, classes, inProgress } = this.props;
        const {
            filterQuery, expanded, filterColumn, order, orderBy, rowsPerPage, page, emptyRowHeight,
        } = this.state;

        const tableData = filterQuery
            ? data.filter(x => x[filterColumn].toString().toLowerCase().includes(filterQuery.toLowerCase()))
            : data;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableData.length - page * rowsPerPage);

        return (
            <Paper className={classes.root}>
                <CustomTableToolbar
                    expanded={expanded}
                    filterColumn={filterColumn}
                    query={filterQuery}
                    handleExpandClick={this.handleExpandClick}
                    handleColumnSelect={this.handleColumnSelect}
                    handleQueryChange={this.handleQueryChange}
                />
                {
                    inProgress ? (
                        <div className={classes.inProgress} style={{ height: rowsPerPage * emptyRowHeight }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        <div>
                            {
                                tableData.length > 0 ? (
                                    <div className={classes.tableWrapper}>
                                        <Table className={classes.table} aria-labelledby='tableTitle'>
                                            <colgroup>
                                                <col style={{ width: '40%' }} />
                                                <col style={{ width: '30%' }} />
                                                <col style={{ width: '30%' }} />
                                            </colgroup>
                                            <CustomTableHead
                                                order={order}
                                                orderBy={orderBy}
                                                onRequestSort={this.handleRequestSort}
                                            />
                                            <TableBody>
                                                {stableSort(tableData, getSorting(order, orderBy))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((n) => {
                                                        return (
                                                            <TableRow
                                                                hover
                                                                tabIndex={-1}
                                                            >
                                                                <TableCell component='th' scope='row'>
                                                                    {n.apiName}
                                                                </TableCell>
                                                                <TableCell component='th' scope='row'>
                                                                    {n.version}
                                                                </TableCell>
                                                                <TableCell component='th' scope='row' numeric>
                                                                    {n.hits}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                {
                                                    emptyRows > 0 && (
                                                        <TableRow style={{ height: emptyRowHeight * emptyRows }}>
                                                            <TableCell colSpan={3} />
                                                        </TableRow>
                                                    )
                                                }
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TablePagination
                                                        rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
                                                        colSpan={3}
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
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                ) : (
                                    <div
                                        className={classes.noDataMessage}
                                        style={{ height: (rowsPerPage + 1) * emptyRowHeight }}
                                    >
                                        <FormattedMessage
                                            id='noData.error.body'
                                            defaultMessage='No data available for the selected options.'
                                        />
                                    </div>
                                )
                            }
                        </div>
                    )}
            </Paper>
        );
    }
}

CustomTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    classes: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
};

export default withStyles(styles)(CustomTable);
