import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {
  VictoryPie } from 'victory';
import Paper from '@material-ui/core/Paper';
import { FormattedMessage } from 'react-intl';

const styles = () => ({
  input: {
    display: 'none',
  },
});

class ErrorAnalysisChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { sorteddata } = this.props;

   if (sorteddata == null || sorteddata.length === 0) {
    return (
        <div style={{maxWidth: '100%', maxHeight: '420px', minWidth: '50%', minHeight: '420px', marginRight:'2px', backgroundColor:'#040b4b', marginTop:'5px'}}>
          <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: '1.5px solid #fff',
                    paddingBottom: '7px',
                    paddingTop: '12px',
                    margin: 'auto',
                    textAlign: 'center',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                   // fontSize: '10px',
                    width: '80%',
                }}
                >
                    <FormattedMessage id='widget.errors.heading' defaultMessage='Error Percentage against API Resource template' />

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
      <div style={{maxWidth: '100%', maxHeight: '420px', minWidth: '50%', minHeight: '420px', marginRight:'2px', backgroundColor:'#040b4b', color:'white', margin:'5px'}}>
              <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: '1.5px solid #fff',
                    paddingBottom: '7px',
                    paddingTop: '12px',
                    margin: 'auto',
                    textAlign: 'center',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                   // fontSize: '10px',
                    width: '80%',
                }}
                >
                    <FormattedMessage id='widget.errors.heading' defaultMessage='Error Percentage against API Resource template' />

                </h3>
            </div>
        <svg viewBox="-150 0 500 200">
        <VictoryPie
                animate={{
                    duration: 2000,
                    onLoad: { duration: 1000 }
                    }}
                standalone={false}
                width={200} height={200}
                data={sorteddata}
                
                innerRadius={0} labelRadius={0}
                colorScale="blue"
                style={{ labels: { fontSize: 8, fill: "white" } }}
                />
                {/* <VictoryLabel text="Error Percentage against API Resource template" x={88} y={16} textAnchor="middle" style={{fill:'white', fontSize:'8px',borderBottom: '1px solid #fff'}}/> */}
        </svg>
        
      </div>
    );
    }
  }
}

export default withStyles(styles)(ErrorAnalysisChart);