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
import Paper from '@material-ui/core/Paper';
import MUIDataTable from 'mui-datatables';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { FormattedMessage } from 'react-intl';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';

/**
 * Display Overall Api Info Chart
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Info Chart
 */
export default function ApiInfoChart(props) {
    const { usageData, totalcount, themeName } = props;
    const theme = createMuiTheme({
        useNextVariants: true,
        palette: { type: themeName === 'dark' ? 'dark' : 'light' },
        overrides: {
            MUIDataTable: {
                root: {
                    type: 'dark',
                },
            },
            MUIDataTableHeadCell: {
                data: {
                    fontSize: '15px',
                },
            },
        },
    });

    /**
     * Define colums for the table
     */
    const columns = [
        {
            name: 'apiname',
            label: <FormattedMessage id='heading.apiname' defaultMessage='Api Name' />,
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: 'version',
            label: <FormattedMessage id='heading.version' defaultMessage='Version' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'resourcetemplate',
            label: <FormattedMessage id='heading.resourcetemplate' defaultMessage='ResourceTemplate' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'method',
            label: <FormattedMessage id='heading.method' defaultMessage='Method' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'totalhits',
            label: <FormattedMessage id='heading.hits' defaultMessage='Total Hits' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'error5XX',
            label: <FormattedMessage id='heading.error5xx' defaultMessage='error5XX' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'error4xx',
            label: <FormattedMessage id='heading.error4xx' defaultMessage='error4XX' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        {
            name: 'averagelatency',
            label: <FormattedMessage id='heading.avglatency' defaultMessage='Average Latency' />,
            options: {
                filter: true,
                sort: false,
            },
        },
        '',
    ];

    /**
     * Define options for the table
     */
    const options = {
        filter: true,
        filterType: 'dropdown',
        expandableRows: true,
        selectableRows: 'none',
        isRowExpandable: (dataIndex, expandedRows) => {
            if (expandedRows.data.length > 0 && expandedRows.data.filter(
                d => d.dataIndex === dataIndex,
            ).length === 0) return false;
            return true;
        },
        renderExpandableRow: (rowData) => {
            const expandeddata = [];
            const colSpan = 1;

            usageData.forEach((element) => {
                if (element[0] === rowData[0] && element[7] === rowData[1]) {
                    expandeddata.push(element);
                }
            });

            return (
                expandeddata.map(item => (
                    <TableRow>
                        <TableCell colSpan={colSpan} />
                        <TableCell colSpan={colSpan} />
                        <TableCell />
                        <TableCell>
                            {item[1]}
                        </TableCell>
                        <TableCell>
                            {item[2]}
                        </TableCell>
                        <TableCell>
                            {item[3]}
                        </TableCell>
                        <TableCell>
                            {item[4]}
                        </TableCell>
                        <TableCell>
                            {item[5]}
                        </TableCell>
                        <TableCell>
                            {item[6]}
                        </TableCell>
                    </TableRow>
                ))
            );
        },
    };

    return (
        <Paper>
            <MuiThemeProvider theme={theme}>
                <MUIDataTable
                    data={totalcount}
                    columns={columns}
                    options={options}
                />
            </MuiThemeProvider>
        </Paper>
    );
}

ApiInfoChart.propTypes = {
    usageData: PropTypes.instanceOf(Object).isRequired,
    totalcount: PropTypes.instanceOf(Object).isRequired,
    themeName: PropTypes.string.isRequired,
};
