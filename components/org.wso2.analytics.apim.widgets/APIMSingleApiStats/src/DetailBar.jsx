/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import { withStyles } from '@material-ui/core/styles';
import TotalReqcount from './TotalReqcount';
import TotalErrorcount from './TotalErrorcount';
import TotalErrorRatecount from './TotalErrorRatecount';
import TotalLatencycount from './TotalLatencycount';

const styles = ({
  
  divdata: {
    width: '25%', 
    float: 'left',
  }

});

class DetailBar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { totalreqcount, totalerrorcount, avglatency, formatederrorpercentage, timeFrom, timeTo } = this.props;
    return (
      <div>
        <div style={styles.divdata}>
            <TotalReqcount totalreqcount={totalreqcount} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={styles.divdata}>
            <TotalErrorcount totalerrorcount={totalerrorcount} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={styles.divdata}>
            <TotalErrorRatecount formatederrorpercentage={formatederrorpercentage} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        <div style={styles.divdata}>
            <TotalLatencycount avglatency={avglatency} timeFrom={timeFrom} timeTo={timeTo}/>
        </div>
        
      </div>
    );
  }
}

export default withStyles(styles)(DetailBar);