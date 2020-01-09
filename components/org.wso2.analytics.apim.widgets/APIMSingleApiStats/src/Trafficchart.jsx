import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {
  VictoryChart, VictoryArea, VictoryAxis
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
  paper: {
    background: '#969696',
    width: '75%',
    padding: '4%',
    border: '1.5px solid #fff',
    margin: 'auto',
    marginTop: '5%',
},
headingWrapper: {
  height: '5%',
  margin: 'auto',
  paddingTop: '10px',
  width: '90%',
},
});

class Trafficchart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { trafficdata} = this.props;

    const chartTheme = {
      axis: {
       style: {
         tickLabels: {
           // this changed the color of my numbers to white
           fill: 'white',
           fontSize: '8px',
           angle: 25,
         },
        // grid: { stroke: 'none' },
       },
     },
   };

   if (trafficdata.length === 0) {
    return (
        <div style={{maxWidth: '100%', maxHeight: '420px', minWidth: '50%', minHeight: '420px', marginRight:'2px', backgroundColor:'#040b4b', marginTop:'5px'}}>
          <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: '1.5px solid #fff',
                    paddingBottom: '7px',
                    paddingTop: '7px',
                    margin: 'auto',
                    textAlign: 'center',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                    width: '80%',
                }}
                >
                    <FormattedMessage id='widget.traffic.heading' defaultMessage='No of HITS against TIME' />

                </h3>
            </div>
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
      <div style={{maxWidth: '100%', maxHeight: '420px', minWidth: '50%', minHeight: '420px', marginRight:'2px', backgroundColor:'#040b4b', margin:'5px'}}>
        <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: '1.5px solid #fff',
                    paddingBottom: '7px',
                    paddingTop: '12px',
                    margin: 'auto',
                    textAlign: 'center',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                    width: '80%',
                }}
                >
                    <FormattedMessage id='widget.traffic.heading' defaultMessage='No of HITS against TIME' />

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
            data={trafficdata}
          />
          <VictoryAxis
            label='Time'
            style={{
              axisLabel: {
              padding: 40,
              fill: '#ffffff',
              fontSize: '8px',
              },
            }}/>

            <VictoryAxis
                dependentAxis
                label='Hits'
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

export default withStyles(styles)(Trafficchart);