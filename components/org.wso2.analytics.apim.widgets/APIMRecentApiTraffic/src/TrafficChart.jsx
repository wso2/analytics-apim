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
import { withStyles } from '@material-ui/core/styles';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory';


const styles = ({
    victorybar: {
        display: 'flex',
        flexWrap: 'wrap',
        data: { fill: 'rgb(0, 107, 201)', width: 5 },
    },
    victoryaxis: {
        axisLabel: {
            padding: 30,
            fill: '#ffffff',
            fontSize: '8px',
        },
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
                angle: 45,
            },
            grid: { stroke: 'none' },
        },
    },
};


class TrafficChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        const { data } = this.props;
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
                    style={styles.victorybar}
                    animate={{
                        duration: 1000,
                        onLoad: { duration: 500 },
                    }}
                    data={data}
                    x='API'
                    y='Traffic'
                />
                <VictoryAxis
                    label='API Name'
                    style={styles.victoryaxis}
                />
                <VictoryAxis
                    dependentAxis
                    label='Total Traffic'
                    style={styles.victoryaxis}
                />
            </VictoryChart>
        );
    }
}

TrafficChart.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(TrafficChart);
