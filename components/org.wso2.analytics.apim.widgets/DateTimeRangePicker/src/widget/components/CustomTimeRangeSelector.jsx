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
import Moment from 'moment';
import TimePicker from './TimePicker';
import Button from '@material-ui/core/Button/Button';
import Typography from '@material-ui/core/Typography/Typography';
export default class CustomTimeRangeSelector extends React.Component {
  state = {
    invalidDateRange: false,
    customRangeGranularityValue: this.props.customRangeGranularityValue,
    startTime: this.props.startTime,
    endTime: new Date(),
    applyButtonBackgroundColor: '#ef6c00',
    cancelButtonBackgroundColor: '#999'
  };

  /**
   * Setting the start time using the custom  ranges
   * @param{object} date
   */
  handleStartTimeChange = (startTime) => {
    const { endTime } = this.state;
    if (Moment(startTime).isSameOrAfter(Moment(endTime))) {
      this.setState({
        invalidDateRange: true,
        applyButtonBackgroundColor: '#999'
      });
    } else {
      this.setState({
        invalidDateRange: false,
        applyButtonBackgroundColor: '#ef6c00',
        startTime: startTime
      });
    }
  };

  /**
   * Setting the end time using the custom  ranges
   * @param{object} date
   */
  handleEndTimeChange = (endTime) => {
    const { startTime } = this.state;
    if (Moment(startTime).isSameOrAfter(Moment(endTime))) {
      this.setState({
        invalidDateRange: true,
        applyButtonBackgroundColor: '#999'
      });
    } else {
      this.setState({
        invalidDateRange: false,
        applyButtonBackgroundColor: '#ef6c00',
        endTime: endTime
      });
    }
  };

  /**
   * Publishing the custom time range
   * onChangeCustom()=>handleGranularityChangeForCustom(mode, startTime, endTime, granularity)
   * mode:custom,
   * granularity:second,minute,hour,day,month,year
   */
  publishCustomTimeRange = () => {
    const { handleClose, onChangeCustom } = this.props;
    const { customRangeGranularityValue, startTime, endTime } = this.state;
    handleClose();
    onChangeCustom('custom', startTime, endTime, customRangeGranularityValue);
  };

  /**
   * Change the granularity value of the custom ranges. View of the custom ranges will
   * change according to the granularity value
   * @param{string} customGranularityValue:'second','minute','hour' etc
   */
  changeCustomRangeGranularity = (customGranularityValue) => {
    this.props.disableSelectedQuickRangeValue();
    const { startTime, endTime } = this.state;
    let invalidDateRange = false;
    let applyBtnColor = '#ef6c00';
    if (Moment(startTime).isSameOrAfter(Moment(endTime), customGranularityValue)) {
      invalidDateRange = true;
      applyBtnColor = '#999';
    }

    this.setState({
      applyButtonBackgroundColor: applyBtnColor,
      invalidDateRange: invalidDateRange,
      customRangeGranularityValue: customGranularityValue
    });
  };

  /**
   * Change the background color of the apply button when hovering the button
   * @param{string} color
   */
  setApplyButtonBgColor = (color) => {
    this.setState({
      applyButtonBackgroundColor: color
    });
  };

  /**
   * Change the background color of the cancel button when hovering the button
   * @param{string} color
   */
  setCancelButtonBgColor = (color) => {
    this.setState({
      cancelButtonBackgroundColor: color
    });
  };

  customTimeRangeSelectorStyles = {
    customRangeContainer: {
      marginLeft: 1,
      height: 330,
      display: 'flex',
      flexDirection: 'column'
    },
    customRangeButtonContainer: {
      marginLeft: 15
    },
    customButtons: {
      fontSize: 10,
      padding: 0.3
    },
    timePicker: {
      flexWrap: 'wrap',
      display: 'flex',
      height: 220,
      padding: 5,
      color: this.props.theme.name === 'dark' ? '#ffffff' : '#000',
      marginTop: 10,
      marginLeft: 20,
      marginRight: 10,
      borderBottomStyle: 'solid',
      borderBottomWidth: 1,
      borderBottomColor:
        this.props.theme.name === 'dark' ? '#111618' : '#d8d0d0'
    },
    footerButtons: {
      padding: 10,
      color: '#000',
      marginRight: 7
    },
    typographyLabel: {
      fontSize: 12,
      align: 'center'
    }
  };

  /**
   * @returns{JSX}
   */
  render() {
    const { theme, disableSelectedQuickRangeValue } = this.props;
    const {
      customRangeGranularityValue,
      applyButtonBackgroundColor,
      cancelButtonBackgroundColor,
      invalidDateRange,
      startTime,
      endTime
    } = this.state;
    const {
      customRangeContainer,
      customRangeButtonContainer,
      customButtons,
      timePicker,
      footerButtons,
      typographyLabel
    } = this.customTimeRangeSelectorStyles;
    const customRangeButtons = [
      'second',
      'minute',
      'hour',
      'day',
      'month',
      'year'
    ];

    return (
      <div style={customRangeContainer}>
        <div style={customRangeButtonContainer}>
          {customRangeButtons.map((customRangeButton, index) => (
            <Button
              key={index}
              variant="outlined"
              style={{
                ...customButtons,
                borderTopLeftRadius: index === 0 ? 6 : 0,
                borderBottomLeftRadius: index === 0 ? 6 : 0,
                borderTopRightRadius: index === 5 ? 6 : 0,
                borderBottomRightRadius: index === 5 ? 6 : 0,
                backgroundColor:
                  theme.name === 'dark'
                    ? customRangeGranularityValue === customRangeButton
                      ? '#756e71'
                      : '#494547'
                    : customRangeGranularityValue === customRangeButton
                      ? '#e9e8e8'
                      : '#ffffff'
              }}
              onClick={() =>
                this.changeCustomRangeGranularity(customRangeButton)
              }
            >
              {customRangeButton}
            </Button>
          ))}
        </div>
        <div style={timePicker}>
          <div style={{ float: 'left', width: '50%' }}>
            <Typography style={{ ...typographyLabel, color: theme.name === 'dark' ? '#ffffff' : '#000', }}>From</Typography>
            <TimePicker
              disableSelectedQuickRangeValue={disableSelectedQuickRangeValue}
              onChange={this.handleStartTimeChange}
              inputType={customRangeGranularityValue}
              initTime={Moment(startTime)}
              inputName="startTime"
              theme={theme}
            />
          </div>
          <div style={{ float: 'right', width: '50%' }}>

            <Typography style={{ ...typographyLabel, color: theme.name === 'dark' ? '#ffffff' : '#000', }}>To</Typography>
            <TimePicker
              disableSelectedQuickRangeValue={disableSelectedQuickRangeValue}
              onChange={this.handleEndTimeChange}
              inputType={customRangeGranularityValue}
              initTime={Moment(endTime)}
              inputName="endTime"
              startTime={startTime}
              theme={theme}
            />
          </div>
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 15 }}
        >
          <Button
            size="small"
            variant="outlined"
            style={{
              ...footerButtons,
              ...customButtons,
              backgroundColor: cancelButtonBackgroundColor
            }}
            onClick={this.props.handleClose}
            onMouseEnter={() => this.setCancelButtonBgColor('#bbb')}
            onMouseLeave={() => this.setCancelButtonBgColor('#999')}
          >
            Cancel
          </Button>
          <Button
            disabled={invalidDateRange}
            size="small"
            variant="outlined"
            style={{
              ...footerButtons,
              ...customButtons,
              backgroundColor: applyButtonBackgroundColor
            }}
            onClick={this.publishCustomTimeRange}
            onMouseEnter={() => this.setApplyButtonBgColor('#ff9034')}
            onMouseLeave={() => this.setApplyButtonBgColor('#ef6c00')}
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }
}
