/* eslint-disable comma-dangle */
/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import Widget from '@wso2-dashboards/widget';
import DateTimePopper from './components/DateTimePopper';
import { dark, light } from '../theme/Theme';
import IconNotificationSync from '@material-ui/icons/Sync';
import IconNotificationSyncDisabled from '@material-ui/icons/SyncDisabled';
import DateRange from '@material-ui/icons/DateRange';
import Button from '@material-ui/core/Button/Button';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { Menu, MenuItem } from '@material-ui/core';

const CUSTOM_GRANULARITY_MODE = 'custom';
const SAVED_VALUES_KEY = 'dashboard.dtrp.values';

class DateTimePicker extends Widget {
  constructor(props) {
    super(props);
    this.state = {
      width: this.props.width,
      granularityMode: null,
      customRangeGranularityValue: 'month',
      quickRangeGranularityValue: 'Last 3 Months',
      granularityValue: '',
      options: this.props.configs ? this.props.configs.options : {},
      enableSync: false,
      anchorPopperButton: null,
      showBackRanges: false,
      utcAnchorElement: null,
      isUTC: this.getInitialTimezone(),
      startTime: null, // start time in unix timestamp
      endTime: null, // end time in unix timestamp
      granularity: null
    };

    // This will re-size the widget when the glContainer's width is changed.
    if (this.props.glContainer != undefined) {
      this.props.glContainer.on('resize', () =>
        this.setState({
          width: this.props.glContainer.width,
          height: this.props.glContainer.height,
        })
      );
    }
  }

  getInitialTimezone = () => {
    const { tz } = super.getGlobalState('dtrp');
    if (tz && tz.length > 0) {
      return tz.toLowerCase() === 'utc';
    }
    return localStorage.getItem('isUTC') === 'true';
  }

  /**
   * Handle granularity change for the quickRanges
   * @param{String} mode: custom or 'Last 3 Months', 'Last 6 Months', 'Last Year', etc
   */
  handleGranularityChangeForQuick = (quickRangeMode) => {
    this.clearRefreshInterval();
    if (quickRangeMode === CUSTOM_GRANULARITY_MODE)
      return;

    let { startTime, endTime, granularity } = this.state.showBackRanges
        ? this.getStartEndTimesAndGranularityForBackRanges(quickRangeMode)
        : this.getStartEndTimesAndGranularity(quickRangeMode);
    granularity = this.verifyDefaultGranularityOfTimeRange(granularity);
    this.updateTimeRange(startTime, endTime, granularity);

    this.setRefreshInterval();
    // todo: refactor
    this.setState({
      quickRangeGranularityValue: quickRangeMode,
      granularityMode: quickRangeMode,
      granularityValue: granularity,
    });
  };

  /**
   * Disable the selected quickRangeValue when user select customRange
   */
  disableSelectedQuickRangeValue = () => {
    this.setState({
      quickRangeGranularityValue: null
    });
  };

  /**
   * Handling the granularity change for the customRanges
   * @param{String,object,object,String}:mode,startTime,endTime,granularity
   */
  handleGranularityChangeForCustom = (mode, startTime, endTime, granularity) => {
    this.clearRefreshInterval();
    this.updateTimeRange(startTime, endTime, granularity);
    this.setState({
      granularityMode: mode,
      granularityValue: granularity,
      startTime: startTime,
      endTime: endTime,
      quickRangeGranularityValue: null,
      customRangeGranularityValue: granularity
    });
  };

  getStartEndTimesAndGranularity = (quickRangeMode) => {
    let granularity = '',
        startOf = null,
        startTime = this.state.isUTC ? Moment().utc() : Moment();

    switch (quickRangeMode) {
      case 'Last Hour':
        startTime = startTime
            .subtract(1, 'hours')
            .startOf('hour');
        granularity = 'minute';
        startOf = 'hour';
        break;
      case 'Last Day':
        startTime = startTime
            .subtract(1, 'days')
            .startOf('day');
        granularity = 'hour';
        startOf = 'day';
        break;
      case 'Last 7 Days':
        startTime = startTime
            .subtract(7, 'days')
            .startOf('day');
        granularity = 'day';
        startOf = 'day';
        break;
      case 'Last Month':
        startTime = startTime
            .subtract(1, 'months')
            .startOf('month');
        granularity = 'day';
        startOf = 'month';
        break;
      case 'Last 3 Months':
        startTime = startTime
            .subtract(3, 'months')
            .startOf('month');
        granularity = 'month';
        startOf = 'month';
        break;
      case 'Last 6 Months':
        startTime = startTime
            .subtract(6, 'months')
            .startOf('month');
        granularity = 'month';
        startOf = 'month';
        break;
      case 'Last Year':
        startTime = startTime
            .subtract(1, 'months')
            .subtract(1, 'years')
            .startOf('month');
        granularity = 'month';
        startOf = 'month';
        break;
      default:
        // do nothing
    }
    return {
      startTime,
      endTime: (this.state.isUTC ? Moment().utc() : Moment()).startOf(startOf),
      granularity
    };
  };

  getStartEndTimesAndGranularityForBackRanges = (quickRangeMode) => {
    let granularity = '', startTime = null;
    switch (quickRangeMode) {
      case '1 Min Back':
        startTime = Moment()
            .subtract(1, 'minutes')
            .toDate();
        granularity = 'second';
        break;
      case '15 Min Back':
        startTime = Moment()
            .subtract(15, 'minutes')
            .toDate();
        granularity = 'minute';
        break;
      case '1 Hour Back':
        startTime = Moment()
            .subtract(1, 'hours')
            .toDate();
        granularity = 'minute';
        break;
      case '1 Day Back':
        startTime = Moment()
            .subtract(1, 'days')
            .toDate();
        granularity = 'hour';
        break;
      case '7 Days Back':
        startTime = Moment()
            .subtract(7, 'days')
            .toDate();
        granularity = 'day';
        break;
      case '1 Month Back':
        startTime = Moment()
            .subtract(1, 'months')
            .toDate();
        granularity = 'day';
        break;
      default:
        // do nothing
    }
    return { startTime, granularity, endTime: Moment() };
  };

  verifyDefaultGranularityOfTimeRange = (granularity) => {
    const availableGranularities = this.getAvailableGranularities();
    if (
      availableGranularities.indexOf(
        this.capitalizeCaseFirstChar(granularity)
      ) > -1
    ) {
      return granularity;
    }
    return availableGranularities[0].toLowerCase();
  };

  /**
   *  Generating the views ('1 min ,'15 min' etc) according to default time range
   * @returns {Array} : sorted views
   *    */
  getDefaultTimeRange = () => {
    const { options } = this.state;
    const defaultTimeRange = options.defaultValue || '3 Months';
    const minGranularity = options.availableGranularities || 'From Second';
    let availableViews = [];
    switch (minGranularity) {
      case 'From Second':
      case 'From Minute':
        availableViews = [
          'Last Hour',
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Hour':
        availableViews = [
          'Last Hour',
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Day':
        availableViews = [
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Month':
        availableViews = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];
        break;
      case 'From Year':
        availableViews = ['Last Year'];
        break;
      default:
      // do nothing
    }

    if (availableViews.indexOf(defaultTimeRange) > -1) {
      return defaultTimeRange;
    }
    return availableViews[0];
  };

  updateTimeRange = (startTime, endTime, granularity) => {
    granularity = granularity || this.state.granularity;
    this.setState({ startTime, endTime, granularity });
    super.publish({ from: startTime, to: endTime, granularity})
  }

  /**
   * If URL has a time range, load the time
   */
  loadDefaultTimeRange = () => {
    let storedValueString = localStorage.getItem(SAVED_VALUES_KEY);
    let storedValue = (storedValueString != null) ? JSON.parse(storedValueString) : { };
    const dateTimeRangeInfo = super.getGlobalState('dtrp');
    if (dateTimeRangeInfo.tr || storedValue.tr) {
      const { tr, sd, ed, g, sync } = dateTimeRangeInfo.tr ? dateTimeRangeInfo : storedValue;
      if (tr.toLowerCase() === CUSTOM_GRANULARITY_MODE) {
        if (sd && ed) {
          this.loadUserSpecifiedCustomTimeRange(sd, ed, g || '');
        } else {
          this.handleGranularityChangeForQuick(this.getDefaultTimeRange());
        }
      } else {
        if (sync) {
          this.setState({ enableSync: true });
        }
        this.loadUserSpecifiedTimeRange(tr, g || '');
      }
    } else {
      // Get the default values
      this.handleGranularityChangeForQuick(this.getDefaultTimeRange());
    }
  };

  /**
   * If the url contain a custom time range
   * which specified by the user then load it
   * @param{object,object,String}:start,end,granularity
   */
  loadUserSpecifiedCustomTimeRange = (start, end, granularity) => {
    const startTime = Moment(start);
    const endTime = Moment(end);
    if (startTime != null && endTime != null) {
      this.clearRefreshInterval();
      if (granularity.length === 0 ||
          this.getSupportedGranularitiesForCustom(startTime, endTime)
              .indexOf(this.capitalizeCaseFirstChar(granularity)) === -1) {
        granularity = this.getAvailableGranularities()[0].toLowerCase();
      }
      this.updateTimeRange(startTime, endTime, granularity);
      this.setState({
        granularityMode: CUSTOM_GRANULARITY_MODE,
        granularityValue: granularity,
        quickRangeGranularityValue: null,
        customRangeGranularityValue: granularity
      });
    } else {
      this.handleGranularityChangeForQuick(this.getDefaultTimeRange());
    }
  };

  /**
   * When URL contains a quickTimerange which specified by the user
   * then load it
   * @param{String,String}:range,granularity
   */
  loadUserSpecifiedTimeRange = (range, granularity) => {
    const timeRange = this.getTimeRangeName(range);
    if (timeRange.length > 0) {
      const supportedTimeRanges = this.getSupportedTimeRanges();
      if (supportedTimeRanges.indexOf(timeRange) > -1) {
        if (granularity.length > 0) {
          this.clearRefreshInterval();
          granularity = granularity.toLowerCase();
          const supportedGranularities = this.getSupportedGranularitiesForFixed(timeRange);
          if (supportedGranularities.indexOf(this.capitalizeCaseFirstChar(granularity)) > -1) {
            const availableGranularities = this.getAvailableGranularities();
            if (availableGranularities.indexOf(this.capitalizeCaseFirstChar(granularity)) === -1) {
              granularity = availableGranularities[0].toLowerCase();
            }
          } else {
            granularity = supportedGranularities[supportedGranularities.length - 1].toLowerCase();
          }
          const { startTime, endTime } = this.getStartEndTimesAndGranularity(timeRange);
          this.updateTimeRange(startTime, endTime, granularity);
          this.setState({
            granularityMode: timeRange,
            granularityValue: granularity,
            quickRangeGranularityValue: timeRange,
            customRangeGranularityValue: granularity
          });
          this.setRefreshInterval();
        } else {
          this.handleGranularityChangeForQuick(timeRange);
        }
      } else {
        this.handleGranularityChangeForQuick(supportedTimeRanges[0]);
      }
    } else {
      this.handleGranularityChangeForQuick(this.getDefaultTimeRange());
    }
  };

  /**
   * Return the name of the time range
   * @param{String} timeRange
   */
  getTimeRangeName = (timeRange) => {
    return {
      lasthour: 'Last Hour',
      lastday: 'Last Day',
      last7days: 'Last 7 Days',
      lastmonth: 'Last Month',
      last3months: 'Last 3 Months',
      last6months: 'Last 6 Months',
      lastyear: 'Last Year'
    }[timeRange] || '';
  };

  componentWillMount() {
    this.loadDefaultTimeRange();
  }

  componentWillUnmount() {
    clearInterval(this.state.refreshIntervalId);
  }

  /**
   * @returns{JSX}
   */
  render() {
    const { granularityMode } = this.state;
    return (
      <MuiThemeProvider
        theme={this.props.muiTheme.name === 'dark' ? dark : light}
      >
        <div
          style={{
            float: 'right',
            marginTop: 2,
            marginRight: 20,
          }}
        >
          {this.renderPopover()}
          {this.renderTimeIntervalDescriptor(granularityMode)}
        </div>
      </MuiThemeProvider>
    );
  }

  /**
   * Handling the closing and opening events of the popover
   *
   */
  popoverHandler = (event) => {
    this.setState({
      anchorPopperButton: event.currentTarget
    });
  };

  /**
   * Closing the popover when selecting quickRanges,applying customRange date value,outside mouse click
   */
  popoverClose = () => {
    this.setState({
      anchorPopperButton: null
    });
  };

  selectPreferredTimezone = (value) => {
    const isUTC = (value === 'UTC');
    localStorage.setItem('isUTC', isUTC);
    this.setState({isUTC, utcAnchorElement: null});
  };

  getDateFormatForQuickRangeMode = (mode) => {
    let format = '';
    switch (mode) {
      case 'Last Hour':
      case 'Last Day':
      case 'Last 7 Days':
      case '1 Min Back':
      case '15 Min Back':
      case '1 Hour Back':
      case '1 Day Back':
      case '7 Days Back':
        format = 'YYYY-MMMM-DD hh:mm:ss A';
        break;
      case 'Last Month':
      case 'Last 3 Months':
      case 'Last 6 Months':
      case '1 Month Back':
        format = 'YYYY-MMMM-DD';
        break;
      case 'Last Year':
        format = 'YYYY-MMMM';
        break;
      case CUSTOM_GRANULARITY_MODE:
        format = 'YYYY-MMMM-DD hh:mm A';
        break;
      default:
        // do nothing
    }
    return format;
  }

  /**
   * Showing the popover
   */
  renderPopover() {
    const {
      anchorPopperButton,
      customRangeGranularityValue,
      quickRangeGranularityValue,
      startTime,
      endTime,
      options,
      showBackRanges,
      isUTC
    } = this.state;
    const { muiTheme } = this.props;
    if (anchorPopperButton) {
      return (
        <DateTimePopper
          onClose={this.popoverClose}
          anchorPopperButton={anchorPopperButton}
          open={Boolean(anchorPopperButton)}
          options={options}
          onChangeCustom={this.handleGranularityChangeForCustom}
          changeQuickRangeGranularities={this.changeQuickRangeGranularities}
          theme={muiTheme}
          startTime={isUTC ? Moment(startTime).utc() : Moment(startTime)}
          endTime={isUTC ? Moment(endTime).utc() : Moment(endTime)}
          customRangeGranularityValue={customRangeGranularityValue}
          quickRangeGranularityValue={quickRangeGranularityValue}
          disableSelectedQuickRangeValue={this.disableSelectedQuickRangeValue}
          showBackRanges={showBackRanges}
          setShowBackRanges={(value) => { this.setState({ showBackRanges: value })}}
          isUTC={isUTC}
        />
      );
    }
  }

  /**
   * Shows the final output of the selected date time range
   * @param{String} custom or !custom
   */
  renderTimeIntervalDescriptor = (quickRangeMode) => {
    const { startTime, endTime, granularityValue, enableSync, isUTC } = this.state;
    const format = this.getDateFormatForQuickRangeMode(quickRangeMode);
    let timeRange;
    if (isUTC) {
      timeRange = Moment(startTime).utc().format(format) + ' - ' + Moment(endTime).utc().format(format);
    } else {
      timeRange = Moment(startTime).format(format) + ' - ' + Moment(endTime).format(format);
    }
    if (quickRangeMode && startTime && endTime) {
      this.setQueryParamToURL(quickRangeMode.replaceAll(' ', '').toLowerCase(), startTime, endTime, granularityValue,
          enableSync, isUTC ? 'utc' : 'local');
      localStorage.setItem(SAVED_VALUES_KEY, JSON.stringify({
        tr: granularityMode.replace(' ', '').toLowerCase(),
        sd: startTime.toLowerCase(),
        ed: endTime.toLowerCase(),
        g: this.state.granularityValue,
        sync: this.state.enableSync,
        tz: isUTC ? 'utc' : 'local'
      }));
      return (
        <div
          style={{
            marginTop: 15,
            backgroundColor:
              this.props.muiTheme.name === 'dark' ? '#2b2b2b' : '#e8e8e8'
          }}
        >
          <Button onClick={this.popoverHandler} style={{ fontSize: 16 }}>
            <span style={{ paddingRight: 10, marginBottom: -2 }}>
              <DateRange style={{ fontSize: 17 }} />
            </span>
            {`  ${timeRange} `}
            <i style={{ paddingLeft: 5, paddingRight: 5 }}> per</i>
            {this.getDefaultSelectedOption()}
          </Button>
          <Button onClick={(e) => this.setState({ utcAnchorElement: e.currentTarget })}>
            {!!this.state.isUTC ? 'UTC' : 'Local'}
          </Button>
          <Button onClick={this.autoSyncClick}>
            {this.state.enableSync === true ? (
              <IconNotificationSync style={{ color: '#ef6c00' }} />
            ) : (
                <IconNotificationSyncDisabled />
              )}
          </Button>
          <Menu 
            anchorEl={this.state.utcAnchorElement}
            onClose={() => this.selectPreferredTimezone()}
            open={Boolean(this.state.utcAnchorElement)}
          >
            <MenuItem onClick={() => this.selectPreferredTimezone('LOCAL')}>Local</MenuItem>
            <MenuItem onClick={() => this.selectPreferredTimezone('UTC')}>UTC</MenuItem>
          </Menu>
        </div>
      );
    }
    return null;
  };

  /**
   * Shows the granularity value for the selected time range
   * Example:When user select 1hour it shows  granularity as 'per minute'
   */
  getDefaultSelectedOption() {
    if (this.state.granularityMode === CUSTOM_GRANULARITY_MODE) {
      return this.verifySelectedGranularityForCustom(
        this.state.granularityValue
      );
    }
    return this.verifyDefaultGranularityOfTimeRange(this.state.granularityValue);
  }

  verifySelectedGranularityForCustom = (granularity) => {
    if (
      this.getSupportedGranularitiesForCustom(
        this.state.startTime,
        this.state.endTime
      ).indexOf(this.capitalizeCaseFirstChar(granularity)) > -1
    ) {
      return granularity;
    }
    return '';
  };

  /**
   * Changing the final date time out-put's granularity value and the custom range
   * granularity value according to the selected quickRange value
   * @param{String} granularityValue
   */
  changeQuickRangeGranularities = (granularityValue) => {
    this.handleGranularityChangeForQuick(granularityValue);
    let customRangeGranularityValue = '';
    if (this.state.showBackRanges) {
      switch (granularityValue) {
        case '1 Min Back':
          customRangeGranularityValue = 'second';
          break;
        case '15 Min Back':
        case '1 Hour Back':
          customRangeGranularityValue = 'minute';
          break;
        case '1 Day Back':
          customRangeGranularityValue = 'hour';
          break;
        case '7 Days Back':
        case '1 Month Back':
          customRangeGranularityValue = 'day';
          break;
        default:
      }
    } else {
      switch (granularityValue) {
        case 'Last Hour':
          customRangeGranularityValue = 'minute';
          break;
        case 'Last Day':
          customRangeGranularityValue = 'hour';
          break;
        case 'Last 7 Days':
        case 'Last Month':
          customRangeGranularityValue = 'day';
          break;
        case 'Last 3 Months':
        case 'Last 6 Months':
        case 'Last Year':
          customRangeGranularityValue = 'month';
          break;
        default:
      }
    }
    this.setState({
      granularityMode: granularityValue,
      anchorPopperButton: null,
      customRangeGranularityValue: customRangeGranularityValue,
      quickRangeGranularityValue: granularityValue
    });
  };

  capitalizeCaseFirstChar = (str) => {
    let result = '';
    if (str) {
      result = str.charAt(0).toUpperCase() + str.slice(1);
    }
    return result;
  };

  getSupportedTimeRanges = () => {
    const minGranularity =
      this.state.options.availableGranularities || 'From Second';
    let timeRanges = [];
    switch (minGranularity) {
      case 'From Second':
      case 'From Minute':
        timeRanges = [
          'Last Hour',
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Hour':
        timeRanges = [
          'Last Hour',
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Day':
        timeRanges = [
          'Last Day',
          'Last 7 Days',
          'Last Month',
          'Last 3 Months',
          'Last 6 Months',
          'Last Year'
        ];
        break;
      case 'From Month':
        timeRanges = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];
        break;
      case 'From Year':
        timeRanges = ['Last Year'];
        break;
      default:
      // do nothing
    }
    return timeRanges;
  };

  getAvailableGranularities = () => {
    const minGranularity =
      this.state.options.availableGranularities || 'From Second';
    let granularities = [];
    switch (minGranularity) {
      case 'From Second':
        granularities = ['Second', 'Minute', 'Hour', 'Day', 'Month', 'Year'];
        break;
      case 'From Minute':
        granularities = ['Minute', 'Hour', 'Day', 'Month', 'Year'];
        break;
      case 'From Hour':
        granularities = ['Hour', 'Day', 'Month', 'Year'];
        break;
      case 'From Day':
        granularities = ['Day', 'Month', 'Year'];
        break;
      case 'From Month':
        granularities = ['Month', 'Year'];
        break;
      case 'From Year':
        granularities = ['Year'];
        break;
      default:
      // do nothing
    }
    return granularities;
  };

  /**
   * Returning the granularity list according to the granularity mode that select.
   * @param{string} granularityMode : selected value as 'second','minute','hour' etc
   */
  getSupportedGranularitiesForFixed = (granularityValue) => {
    let supportedGranularities = [];
    switch (granularityValue) {
      case 'Last Hour':
        supportedGranularities = ['Second', 'Minute', 'Hour'];
        break;
      case 'Last Day':
      case 'Last 7 Days':
        supportedGranularities = ['Second', 'Minute', 'Hour', 'Day'];
        break;
      case 'Last Month':
      case 'Last 3 Months':
      case 'Last 6 Months':
        supportedGranularities = ['Second', 'Minute', 'Hour', 'Day', 'Month'];
        break;
      case 'Last Year':
        supportedGranularities = [
          'Second',
          'Minute',
          'Hour',
          'Day',
          'Month',
          'Year'
        ];
        break;
      default:
      // do nothing
    }
    return supportedGranularities;
  };

  getSupportedGranularitiesForCustom = (startTime, endTime) => {
    const start = Moment(startTime);
    const end = Moment(endTime);
    const supportedGranularities = [];

    if (end.diff(start, 'seconds') !== 0) {
      supportedGranularities.push('Second');
    }
    if (end.diff(start, 'minutes') !== 0) {
      supportedGranularities.push('Minute');
    }
    if (end.diff(start, 'hours') !== 0) {
      supportedGranularities.push('Hour');
    }
    if (end.diff(start, 'days') !== 0) {
      supportedGranularities.push('Day');
    }
    if (end.diff(start, 'months') !== 0) {
      supportedGranularities.push('Month');
    }
    if (end.diff(start, 'years') !== 0) {
      supportedGranularities.push('Year');
    }
    return supportedGranularities;
  };

  /**
   * Auto sync of the date time
   */
  autoSyncClick = () => {
    if (!this.state.enableSync) {
      this.setState(
        {
          enableSync: true
        },
        this.setRefreshInterval
      );
    } else {
      this.setState({
        enableSync: false
      });
      this.clearRefreshInterval();
    }
  };

  /**
   * Setting a refresh interval for syncing the time
   */
  setRefreshInterval = () => {
    const { enableSync, options, granularityMode, granularityValue } = this.state;

    if (enableSync) {
      const refreshInterval = options.autoSyncInterval * 1000 || 10000;
      const refresh = () => {
        let from;
        if (granularityMode === CUSTOM_GRANULARITY_MODE) {
          from = this.state.startTime.getTime();
        } else {
          from = this.getStartEndTimesAndGranularity(granularityMode).startTime;
        }
        this.updateTimeRange(from, new Date().getTime(), granularityValue);
      };
      const intervalID = setInterval(refresh, refreshInterval);
      this.setState({ refreshIntervalId: intervalID });
    }
  };

  /**
   * Clearing the refresh interval
   */
  clearRefreshInterval = () => {
    clearInterval(this.state.refreshIntervalId);
    this.setState({
      refreshIntervalId: null
    });
  };

  /**
   * Registering global parameters in the dashboard
   * @param  {String} timeRange
   * @param {String} startTime
   * @param {String} endTime
   * @param {String} granularity granularity type 'second','minute'
   * @pram {Boolean} autoSync
   * @param {String} timeZone Time zone (utc | local)
   */
  setQueryParamToURL = (timeRange, startTime, endTime, granularity, autoSync, timeZone) => {
    super.setGlobalState('dtrp', {
      tr: timeRange,
      sd: startTime,
      ed: endTime,
      g: granularity,
      sync: autoSync,
      tz: timeZone,
    });
  };
}

global.dashboard.registerWidget('DateRangePicker', DateTimePicker);
