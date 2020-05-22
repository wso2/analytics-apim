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
import { FormattedMessage } from 'react-intl';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import SearchIcon from '@material-ui/icons/Search';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import TextField from '@material-ui/core/TextField';
import Collapse from '@material-ui/core/Collapse';
import { withStyles } from '@material-ui/core/styles';
import { Menu, MenuItem } from '@material-ui/core';
import { buildCSVBody, buildCSVHeader, downloadCSV, downloadPDF, stableSort, getSorting } from './Utils.js';
import jsPDF from "jspdf";
import 'jspdf-autotable';

const styles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
    },
    title: {
        marginTop: '20px',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: '40%',
        marginTop: 0,
    },
    menu: {
        width: 150,
    },
    actions: {
        marginTop: '10px',
    },
    expand: {
        marginLeft: 'auto',
    },
    collapsef: {
        marginRight: 0,
    },
});

/**
 * Create React Component for Custom Table Toolbar
 */
class CustomTableToolbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen: false,
            anchorElement: null,
        };
        this.handleUserIconClick = this.handleUserIconClick.bind(this);
        this.handleMenuCloseRequest = this.handleMenuCloseRequest.bind(this);
        this.handleCSVDownload = this.handleCSVDownload.bind(this);
        this.handlePDFDownload = this.handlePDFDownload.bind(this);
    }

    handleUserIconClick(event) {
        event.preventDefault();
        this.setState({
            isMenuOpen: !this.state.isMenuOpen,
            anchorElement: event.currentTarget,
        });
    }

    handleMenuCloseRequest() {
        this.setState({
            isMenuOpen: false,
        });
    }

    handleCSVDownload() {
        const { data, columns, title, query, filterColumn, order, orderBy } = this.props;
        const tableData = query
            ? data.filter(x => x[filterColumn].toString().toLowerCase().includes(query.toLowerCase()))
            : data;
        const dataToDownload = stableSort(tableData, getSorting(order, orderBy));

        const header = buildCSVHeader(columns);
        const body = buildCSVBody(dataToDownload);
        const csv = `${header}${body}`.trim();
        downloadCSV(csv, title);
        this.handleMenuCloseRequest();
    };

    handlePDFDownload() {
        const { data, columns, title, query, filterColumn, order, orderBy } = this.props;
        const tableData = query
            ? data.filter(x => x[filterColumn].toString().toLowerCase().includes(query.toLowerCase()))
            : data;
        const sortedData = stableSort(tableData, getSorting(order, orderBy));

        const headers = [['#']];
        const dataToExport = [];
        columns.map(colObj => (headers[0].push(colObj.label.split('table.heading.')[1].toUpperCase())));
        sortedData.map((dataObj, index) => {
            if (dataObj.id) delete dataObj.id;
            const innerArr = Object.values(dataObj);
            innerArr.unshift((index + 1).toString() + ')');
            dataToExport.push(innerArr);
        });

        const doc = new jsPDF({ putOnlyUsedFonts: true });
        downloadPDF(doc, title, headers, dataToExport);
        this.handleMenuCloseRequest();
    };

    render() {
        const {
            classes, handleExpandClick, expanded, filterColumn, handleColumnSelect, handleQueryChange, query, menuItems
        } = this.props;

        return (
            <Toolbar style={{ display: 'block' }}>
                <div className={classes.root}>
                    <div className={classes.actions}>
                        <Tooltip title={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}>
                            <IconButton
                                className={classes.expand}
                                onClick={handleExpandClick}
                                aria-expanded={expanded}
                                aria-label={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}
                            >
                                <SearchIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={<FormattedMessage id='export.label.title' defaultMessage='Export' />}>
                            <IconButton
                                className={classes.expand}
                                onClick={this.handleUserIconClick}
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <span>
                            <Menu
                                open={this.state.isMenuOpen}
                                anchorEl={this.state.anchorElement}
                                keepMounted
                                onClose={this.handleMenuCloseRequest}
                            >
                                <MenuItem onClick={this.handleCSVDownload}> CSV </MenuItem>
                                <MenuItem onClick={this.handlePDFDownload}> PDF </MenuItem>
                            </Menu>
                        </span>
                    </div>
                </div>
                <Collapse in={expanded} timeout='auto' unmountOnExit className={classes.collapsef}>
                    <div>
                        <TextField
                            id='column-select'
                            select
                            label={<FormattedMessage id='filter.column.menu.heading' defaultMessage='Column Name' />}
                            InputLabelProps={{
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'Hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                            className={classes.textField}
                            value={filterColumn}
                            onChange={handleColumnSelect}
                            SelectProps={{
                                MenuProps: {
                                    className: classes.menu,
                                },
                            }}
                            margin='normal'
                        >
                            { menuItems }
                        </TextField>
                        <TextField
                            id='query-search'
                            label={<FormattedMessage id='filter.search.placeholder' defaultMessage='Search Field' />}
                            InputLabelProps={{
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'Hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                            type='search'
                            value={query}
                            className={classes.textField}
                            onChange={handleQueryChange}
                            margin='normal'
                        />
                    </div>
                </Collapse>
            </Toolbar>
        );
    }
}

CustomTableToolbar.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    expanded: PropTypes.string.isRequired,
    filterColumn: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    handleExpandClick: PropTypes.func.isRequired,
    handleColumnSelect: PropTypes.func.isRequired,
    handleQueryChange: PropTypes.func.isRequired,
};

export default withStyles(styles)(CustomTableToolbar);
