/* eslint-disable indent */
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
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory';


const styles = theme => ({ 
    root: {
        width: '750px',
        height: '500px',
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
});


// theme for the chart
const chartTheme = {
    axis: {
     style: {
       tickLabels: {
         // this changed the color of my numbers to white
         fill: 'white',
         fontSize: '6px',
         angle: 25,
       },
       grid: { stroke: 'none' },
     },
   },
 };


// dataset for the chart
const dataset = [];


//React component for table data
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
           // rowsPerPage: 5,
            orderBy: 'hits',
            order: 'desc',
            expanded: false,
            query: '',
        };
    }

    //handle the latencydatatable
    render() {
        const { data, classes } = this.props;

        console.log(data);
        //Set the table data
        //setdata(latancyData);
        
        return (
                  <VictoryChart
                  theme={chartTheme}
                  domainPadding={{ x: 30 }}
                  maxDomain={{ x: 5 }}
                  height={245}
                 >
                  <VictoryBar
                    barWidth={6}
                    cornerRadius={{ topRight: 5 }}
                    style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    data: { fill: 'rgb(0, 107, 201)', width: 5 },
                  }}
                    animate={{
                    duration: 2000,
                    onLoad: { duration: 1000 },
                  }}
                    data={data}
                    x='ApiName'
                  // eslint-disable-next-line indent
                    y='maxLatency'
                />
                  <VictoryAxis
                    label='API Name'
                    style={{
                    axisLabel: {
                      padding: 30,
                      fill: '#ffffff',
                      fontSize: '8px',
                    },
                  }}
                />
                  <VictoryAxis
                    dependentAxis
                    label='Max Latency (ms)'
                    style={{
                    axisLabel: {
                      padding: 30,
                      fill: '#ffffff',
                      fontSize: '8px',
                    },
                  }}
                />
              </VictoryChart>
        );
    }
}

CustomTable.propTypes = {
    latancyData: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomTable);
