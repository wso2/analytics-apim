/* eslint-disable react/no-unused-state */
/* eslint-disable require-jsdoc */
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
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import MUIDataTable from 'mui-datatables';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';


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
});

class ApiInfoChart extends React.Component {
  constructor(props) {
    super(props);
      this.state = {
          tableData: [],
          orderBy: 'hits',
          order: 'desc',
          expanded: false,
          query: '',
          datas: null,
          datass: null,
          finaldata: [],
          finalrowdata: [],
      };
    }

    renderexpandrowdata(rowData) {
        const expandeddata = [];
        const colSpan = rowData.length + 1;
        const { usageData } = this.props;
        usageData.forEach((element) => {
          if (element[0] === rowData[0]) {
            expandeddata.push(element);
          }
        });
      console.log(expandeddata[0][0]);
      return (
          <TableRow>
              <TableCell colSpan={colSpan}>
                  {expandeddata[0][0]}
              </TableCell>
          </TableRow>
      );
    }

  render() {
    const { usageData, totalcount, classes } = this.props;

    const theme = createMuiTheme({
      useNextVariants: true,
      palette: { type: 'dark' },
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

     // console.log(totalcount);


    // define table columns
    const columns = ['Api Name', 'Version', 'ResourceTemplate','Method', 'Total Hits', 'error 5XX', 'error 4XX', 'Average Latency P99', ''];

    // define options for table
    const options = {
      filter: true,
      filterType: 'dropdown',
      expandableRows: true,
      selectableRows: 'none',
      isRowExpandable: (dataIndex, expandedRows) => {
        // Prevent expand/collapse of any row if there are 4 rows expanded already (but allow those already expanded to be collapsed)
        if (expandedRows.data.length > 0 && expandedRows.data.filter(d => d.dataIndex === dataIndex).length === 0) return false;
        return true;
      },
      renderExpandableRow: (rowData) => {
        const expandeddata = [];
        const colSpan = 1;
        usageData.forEach((element) => {
          if (element[0] === rowData[0]) {
            expandeddata.push(element);
          }
        });

      console.log(expandeddata[0][0]);
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
        <Paper className={classes.root}>
            <MuiThemeProvider theme={theme}>
                <MUIDataTable
                    // title={'Api Monitoring -> Recent'}
                    data={totalcount}
                    columns={columns}
                    options={options}
                />
            </MuiThemeProvider>
        </Paper>
    );
  }
}

ApiInfoChart.propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    usageData: PropTypes.instanceOf(Object).isRequired,
    totalcount: PropTypes.instanceOf(Object).isRequired,
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(ApiInfoChart);
