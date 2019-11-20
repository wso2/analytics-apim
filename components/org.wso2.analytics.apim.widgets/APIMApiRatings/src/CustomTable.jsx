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
import PropTypes from 'prop-types';
import MenuItem from '@material-ui/core/MenuItem';
import { CustomTableToolbar } from 'common-lib';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import CustomTableHead from './CustomTableHead';

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
    inProgress: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noDataMessage: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888888',
    },
});

/**
 * Create React Component for Top Rated APIs Table
 */
class CustomTable extends React.Component {
    /**
     * Creates an instance of CustomTable.
     * @param {any} props @inheritDoc
     * @memberof CustomTable
     */
    constructor(props) {
        super(props);

        this.state = {
            tableData: [],
            page: 0,
            rowsPerPage: 5,
            orderBy: 'ratings',
            order: 'desc',
            expanded: false,
            filterColumn: 'apiname',
            query: '',
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
        this.setState({ query: event.target.value });
    };

    /**
     * Render the Custom Table
     * @return {ReactElement} customTable
     */
    render() {
        const { data, classes, loadingTopApis } = this.props;
        const {
            query, expanded, filterColumn, order, orderBy, rowsPerPage, page,
        } = this.state;

        this.state.tableData = query
            ? data.filter(x => x[filterColumn].toString().toLowerCase().includes(query.toLowerCase()))
            : data;
        const { tableData } = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableData.length - page * rowsPerPage);

        const menuItems = (
            <React.Fragment>
                <MenuItem value='apiname'>
                    <FormattedMessage id='table.heading.apiname' defaultMessage='API NAME' />
                </MenuItem>
                <MenuItem value='ratings'>
                    <FormattedMessage id='table.heading.ratings' defaultMessage='RATING' />
                </MenuItem>
            </React.Fragment>
        );
        return (
            <Paper className={classes.root}>
                <CustomTableToolbar
                    expanded={expanded}
                    filterColumn={filterColumn}
                    query={query}
                    handleExpandClick={this.handleExpandClick}
                    handleColumnSelect={this.handleColumnSelect}
                    handleQueryChange={this.handleQueryChange}
                    title='TOP RATED APIS :'
                    menuItems={menuItems}
                />
                { loadingTopApis ? (
                    <div className={classes.inProgress} style={{ height: rowsPerPage * 49 }}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        {
                            tableData.length > 0 ? (
                                <div className={classes.tableWrapper}>
                                    <Table className={classes.table} aria-labelledby='tableTitle'>
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
                                                                {n.apiname}
                                                            </TableCell>
                                                            <TableCell numeric>
                                                                {n.ratings}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            {emptyRows > 0 && (
                                                <TableRow style={{ height: 49 * emptyRows }}>
                                                    <TableCell colSpan={6} />
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div
                                    className={classes.noDataMessage}
                                    style={{ height: (rowsPerPage + 1) * 49 }}
                                >
                                    <FormattedMessage
                                        id='nodata.error.body'
                                        defaultMessage='No data available for the selected options.'
                                    />
                                </div>
                            )
                        }
                    </div>
                )}
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
}

CustomTable.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    data: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomTable);
