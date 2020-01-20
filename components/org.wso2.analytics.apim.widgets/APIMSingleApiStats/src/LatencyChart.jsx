import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {
  VictoryChart, VictoryArea, VictoryAxis
 } from 'victory';
import Paper from '@material-ui/core/Paper';
import { FormattedMessage } from 'react-intl';

const styles = {
  input: {
    display: 'none',
  },
  paper: {
    background: '#040b4b',
    width: '75%',
    padding: '4%',
    margin: 'auto',
    paddingTop: '150px',
  },
  headingWrapper: {
    height: '5%',
    margin: 'auto',
    paddingTop: '10px',
    width: '90%',
  },
  h3: {
    borderBottom: '1.5px solid #fff',
    paddingBottom: '7px',
    paddingTop: '7px',
    margin: 'auto',
    textAlign: 'center',
    fontWeight: 'normal',
    letterSpacing: 1.5,
    width: '80%',
  },
  maindiv:{
    maxWidth: '100%',
    maxHeight: '420px',
    minWidth: '50%',
    minHeight: '420px',
    marginRight:'2px',
    backgroundColor:'#040b4b',
    marginTop:'5px',
  },
  victry:{
    axisLabel: {
      padding: 30,
      fill: '#ffffff',
      fontSize: '8px',
      },
  },
}

class LatencyChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

  render() {
    const { latencydata } = this.props;

    const chartTheme = {
      axis: {
       style: {
         tickLabels: {
           // this changed the color of my numbers to white
           fill: 'white',
           fontSize: '8px',
           angle: 25,
         },
         // grid: { stroke: 'white' },
       },
     },
   };
   if (latencydata === null || latencydata.length === 0) {
    return (
        <div style={styles.maindiv}>
            <div style={styles.headingWrapper}>
                <h3 style={styles.h3}
                >
                    <FormattedMessage id='widget.latency.heading' defaultMessage='proxy LATENCY against TIME' />

                </h3>
            </div>
            <Paper
                elevation={1}
                style={styles.paper}
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
      <div style={styles.maindiv}>
          <div style={styles.headingWrapper}>
                <h3 style={styles.h3}
                >
                    <FormattedMessage id='widget.latency.heading' defaultMessage='AVERAGE LATENCY' />

                </h3>
            </div>
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
            style={{ data: { fill: "#0e0e24" } }}
            data={latencydata}
          />
          <VictoryAxis
            label='Time'
            style={styles.victry}/>

            <VictoryAxis
                dependentAxis
                label='Api Latency(ms)'
                style={styles.victry}/>
        </VictoryChart>
        </svg>
        
      </div>
    );
    }
  }
}

export default withStyles(styles)(LatencyChart);