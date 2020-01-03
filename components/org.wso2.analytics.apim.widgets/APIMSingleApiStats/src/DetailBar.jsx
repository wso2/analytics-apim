import React from 'react';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TotalReqcount from './TotalReqcount';
import TotalErrorcount from './TotalErrorcount';
import TotalErrorRatecount from './TotalErrorRatecount';
import TotalLatencycount from './TotalLatencycount';

const styles = () => ({
  button: {
  // margin: '1%',
  },
  input: {
    display: 'none',
  },
});

class DetailBar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { classes, totalreqcount, totallatencycount, themeName, totalerrorcount, avglatency, formatederrorpercentage, timeFrom, timeTo } = this.props;
    const styles = {
      headingWrapper: {
          height: '10%',
          margin: 'auto',
          paddingTop: '15px',
          width: '90%',
      },
      iconWrapper: {
          float: 'left',
          width: '40%',
          height: '62%',
      },
      icon: {
          display: 'block',
          margin: 'auto',
          marginTop: '25%',
      },
      dataWrapper: {
          float: 'left',
          width: '60%',
          height: '50%',
          paddingTop: '8%',
      },
      weekCount: {
          margin: 0,
          marginTop: '5%',
          color: 'rgb(135,205,223)',
          letterSpacing: 1,
          fontSize: '80%',
      },
      typeText: {
          textAlign: 'left',
          fontWeight: 'normal',
          margin: 0,
          display: 'inline',
          marginLeft: '3%',
          letterSpacing: 1.5,
          fontSize: 'small',
      },
      playIcon: {
          position: 'absolute',
          bottom: '13%',
          right: '8%',
      },
  };

    return (
      <div>
        <div style={{width: '25%', float: 'left'}}>
            <TotalReqcount totalreqcount={totalreqcount} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={{width: '25%', float: 'left'}}>
            <TotalErrorcount totalerrorcount={totalerrorcount} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={{width: '25%', float: 'left'}}>
            <TotalErrorRatecount formatederrorpercentage={formatederrorpercentage} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={{width: '25%', float: 'left'}}>
            <TotalLatencycount avglatency={avglatency} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>

      {/* <Button style={{maxWidth: '25%', maxHeight: '70px', minWidth: '25%', minHeight: '80px', marginRight:'2px', backgroundColor:'#170c36', color:'white'}} variant="outlined" className={classes.button}>
        Total Errors:   
      </Button>
      <Button style={{maxWidth: '25%', maxHeight: '70px', minWidth: '25%', minHeight: '80px', marginRight:'2px', backgroundColor:'#170c36', color:'white'}} variant="outlined" className={classes.button}>
        Total Error Rate:   50%
      </Button>
      <Button style={{maxWidth: '24%', maxHeight: '70px', minWidth: '24%', minHeight: '80px', marginRight:'2px', backgroundColor:'#170c36', color:'white'}} variant="outlined" className={classes.button}>
        Proxy Latency (P99):   {totallatencycount/totalreqcount} ms
      </Button> */}
        
      </div>
    );
  }
}

export default withStyles(styles)(DetailBar);