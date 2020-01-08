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
        
      </div>
    );
  }
}

export default withStyles(styles)(DetailBar);