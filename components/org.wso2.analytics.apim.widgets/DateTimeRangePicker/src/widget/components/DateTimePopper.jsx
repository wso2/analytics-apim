/* eslint-disable react/prop-types */
/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import CustomTimeRangeSelector from './CustomTimeRangeSelector';
import Popover from '@material-ui/core/Popover/Popover';
import Grid from '@material-ui/core/Grid/Grid';
import Button from '@material-ui/core/Button/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography/Typography';

const ranges = {
  quick: [
    'Last Hour',
    'Last Day',
    'Last 7 Days',
    'Last Month',
    'Last 3 Months',
    'Last 6 Months',
    'Last Year'
  ],
  back: [
    '1 Min Back',
    '15 Min Back',
    '1 Hour Back',
    '1 Day Back',
    '7 Days Back',
    '1 Month Back',
  ]
};

const styles = {
  quickRangeContainer: {
    marginTop: 14,
    padding: '0px 5px 5px 5px',
  },
  quickRanges: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
  },
  customRanges: {
    marginTop: 8,
    marginRight: 2,
    marginLeft: -17,
    height: 397,
  },
  rangeHeader: {
    fontSize: 14,
    padding: 0.5,
    margin: 4,
  },
  calendarRanges: {
    fontSize: 10,
  }
}

export default class DateTimePopper extends React.Component {

  constructor(props) {
    super(props);

    if (props.theme.name === 'dark') {
      styles.quickRanges.borderRightColor = '#111618';
      styles.quickRanges.backgroundColor = '#333435';
      styles.customRanges.backgroundColor = '#333435';
      styles.rangeHeader.color = '#ffffff';
      styles.calendarRanges.color = '#ffffff';

    } else {
      styles.quickRanges.borderRightColor = '#d8d0d0';
      styles.quickRanges.backgroundColor = '#ffffff';
      styles.customRanges.backgroundColor = '#ffffff';
      styles.rangeHeader.color = '#000000';
      styles.calendarRanges.color = '#000000';
    }

    this.state = {
      showBackRanges: this.props.showBackRanges
    };
  }

  render() {
    const {
      options,
      onChangeCustom,
      theme,
      onClose,
      startTime,
      endTime,
      customRangeGranularityValue,
      anchorPopperButton,
      open,
      changeQuickRangeGranularities,
      quickRangeGranularityValue,
      disableSelectedQuickRangeValue,
      setShowBackRanges
    } = this.props;

    return (
      <Popover
        id={'popper'}
        open={open}
        anchorEl={anchorPopperButton}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transitionDuration="auto"
        style={{ height: 550 }}
      >
        <Grid container style={{ maxWidth: 520 }}>
          <Grid item xs={3}>
            <div style={styles.quickRangeContainer}>
              <Typography style={styles.rangeHeader}>Quick Ranges</Typography>
              <div style={{ fontSize: 10, padding: '0 5px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.showBackRanges}
                      color="primary"
                      onChange={() => {
                          let newShowBackRanges = !this.state.showBackRanges;
                          setShowBackRanges(newShowBackRanges);
                          this.setState({ showBackRanges: newShowBackRanges});
                      }}
                    />
                  }
                  label={<Typography style={styles.calendarRanges}>Past Ranges</Typography>}
                />
              </div>
              <div style={styles.quickRanges}>
              {(this.state.showBackRanges ? ranges.back : ranges.quick).map((quickRangeButton, index) => (
                <Button
                  size="large"
                  key={index}
                  onClick={() => changeQuickRangeGranularities(quickRangeButton)}
                  style={{
                    border: 0,
                    padding: '5px 10px',
                    lineHeight: 2.4,
                    marginBottom: 5,
                    fontSize: 10,
                    backgroundColor:
                      theme.name === 'dark'
                        ? quickRangeGranularityValue === quickRangeButton
                          ? '#505050'
                          : '#323435'
                        : quickRangeGranularityValue === quickRangeButton
                          ? '#e9e8e8'
                          : '#ffffff'
                  }}
                >
                  {quickRangeButton}
                </Button>
              ))}
              </div>
            </div>
          </Grid>
          <Grid item xs={9}>
            <div style={styles.customRanges}>
              <Typography
                style={{
                  ...styles.rangeHeader,
                  alignContent: 'center',
                  marginTop: 13,
                  marginLeft: 18
                }}
              >
                Custom Ranges
              </Typography>
              <Typography
                style={{
                  ...styles.rangeHeader,
                  fontSize: 10,
                  marginTop: 18,
                  marginLeft: 18
                }}
              >
                Granularity Modes
              </Typography>
              <CustomTimeRangeSelector
                disableSelectedQuickRangeValue={disableSelectedQuickRangeValue}
                quickRangeGranularityValue={quickRangeGranularityValue}
                customRangeGranularityValue={customRangeGranularityValue}
                options={options}
                handleClose={onClose}
                onChangeCustom={onChangeCustom}
                theme={theme}
                startTime={startTime}
                endTime={endTime}
              />
            </div>
          </Grid>
        </Grid>
      </Popover>
    );
  }
}
