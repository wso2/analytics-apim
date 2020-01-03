import React from 'react';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {
  VictoryBar, VictoryChart, VictoryArea, VictoryTheme, VictoryAxis
 } from 'victory';
import Paper from '@material-ui/core/Paper';
import { FormattedMessage } from 'react-intl';

const styles = () => ({
  button: {
  // margin: '1%',
  },
  input: {
    display: 'none',
  },
});

class LatencyChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { classes, latencydata } = this.props;

    const data = [
      {x: "API1", y: 13000},
      {x: "API2", y: 16500},
      {x: "API3", y: 14250},
      {x: "API4", y: 19000},
      {x: "API5", y: 9000},
      {x: "API6", y: 4000},
    ];

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
   if (latencydata === null || latencydata.length === 0) {
    return (
        <div style={{maxWidth: '100%', maxHeight: '375px', minWidth: '50%', minHeight: '375px', marginRight:'2px', backgroundColor:'#040b4b', marginTop:'5px'}}>
            <Paper
                elevation={1}
                style={{background: '#040b4b',
                width: '75%',
                padding: '4%',
                margin: 'auto',
                paddingTop: '150px'}}
            >
                <Typography variant='h5' component='h3'>
                    <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                </Typography>
                <Typography component='p'>
                    <FormattedMessage
                        id='nodata.error.body'
                        defaultMessage='No data available for the selected options.'
                    />
                </Typography>
            </Paper>
        </div>
    );
  }

  else{
    return (
      <div style={{maxWidth: '100%', maxHeight: '375px', minWidth: '50%', minHeight: '375px', marginRight:'2px', backgroundColor:'#040b4b', color:'white', marginTop:'5px'}}>
        <svg viewBox="-50 1 500 200">
          <h6>Traffic Vs Time</h6>
        <VictoryChart
          theme={chartTheme}
          standalone={false}
          width={400}
          height={200}
        >
          <VictoryArea
            animate={{
              duration: 2000,
              onLoad: { duration: 1000 }
            }}
            style={{ data: { fill: "#0c0133" } }}
            data={latencydata}
          />
          <VictoryAxis
            label='Time'
            style={{
              axisLabel: {
              padding: 30,
              fill: '#ffffff',
              fontSize: '8px',
              },
            }}/>

            <VictoryAxis
                dependentAxis
                label='Api Latency'
                style={{
                  axisLabel: {
                  padding: 40,
                  fill: '#ffffff',
                  fontSize: '8px',
                  },
                }}/>
        </VictoryChart>
        </svg>
        
      </div>
    );
    }
  }
}

export default withStyles(styles)(LatencyChart);