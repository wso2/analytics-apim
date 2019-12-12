/* eslint-disable no-console */
/* eslint-disable require-jsdoc */
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


// theme for the chart
const chartTheme = {
    axis: {
     style: {
       tickLabels: {
         // this changed the color of my numbers to white
         fill: 'white',
         fontSize: '8px',
         angle: 25,
       },
       grid: { stroke: 'none' },
     },
   },
 };


// dataset for the chart
const dataset = [];

// set the data for the table

function setdata(data) {
data.forEach((e) => {
    dataset.push({ API: e.apiname, Traffic: e.hits });
    console.log(e);
    // console.log(dataset);
    // dataset
});
}

/**
 * Create React Component for Api Version Usage Summary Table
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
        };
    }


    /**
     * Render the Api Version Usage Summary table
     * @return {ReactElement} customTable
     */


    render() {
        const { data, classes } = this.props;
        console.log(data);

        // Set the table data
        setdata(data);

        return (
            <Paper className={classes.root}>
                <VictoryChart
                    theme={chartTheme}
                    domainPadding={{ x: 30 }}
                    maxDomain={{ x: 5 }}
                >
                    <VictoryBar
                        barWidth={6}
                        style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    data: { fill: '#b3b9c4', width: 5 },
                  }}
                        animate={{
                    duration: 2000,
                    onLoad: { duration: 1000 },
                  }}
                        data={dataset}
                        x='API'
                  // eslint-disable-next-line indent
                        y='Traffic'
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
                        label='Total Traffic'
                        style={{
                    axisLabel: {
                      padding: 30,
                      fill: '#ffffff',
                      fontSize: '8px',
                    },
                  }}
                    />
                </VictoryChart>
            </Paper>
        );
    }
}

CustomTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomTable);
