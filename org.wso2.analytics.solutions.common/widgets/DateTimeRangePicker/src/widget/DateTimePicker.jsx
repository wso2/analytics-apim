/* eslint-disable comma-dangle */
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

import React from "react";
// import Widget from "@wso2-dashboards/widget";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import Moment from "moment";
import Snackbar from "@material-ui/core/Snackbar/Snackbar";
import Widget from "../../mocking/Widget";
import NotificationSync from "@material-ui/icons/Sync";
import NotificationSyncDisabled from "@material-ui/icons/SyncDisabled";
import DateRange from "@material-ui/icons/DateRange";
import widgetConf from "../../resources/widgetConf.json";
import Button from "@material-ui/core/Button/Button";
import DateTimePopper from "./components/DateTimePopper";
import { dark, light } from "../theme/Theme";

// This is the workaround suggested in https://github.com/marmelab/react-admin/issues/1782
const escapeRegex = /([[\].#*$><+~=|^:(),"'`\s])/g;
let classCounter = 0;

export const generateClassName = (rule, styleSheet) => {
  classCounter += 1;

  if (process.env.NODE_ENV === "production") {
    return `c${classCounter}`;
  }

  if (styleSheet && styleSheet.options.classNamePrefix) {
    let prefix = styleSheet.options.classNamePrefix;
    // Sanitize the string as will be used to prefix the generated class name.
    prefix = prefix.replace(escapeRegex, "-");

    if (prefix.match(/^Mui/)) {
      return `${prefix}-${rule.key}`;
    }

    return `${prefix}-${rule.key}-${classCounter}`;
  }

  return `${rule.key}-${classCounter}`;
};

export default class DateTimePicker extends Widget {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.widgetID ? "123" : this.props.widgetID,
      width: this.props.glContainer ? this.props.glContainer.width : "450px",
      height: this.props.glContainer.height,
      granularityMode: "null",
      customRangeGranularityValue: "day",
      quickRangeGranularityValue: "3 Months",
      granularityValue: "",
      options: this.props.configs ? this.props.configs.options : "",
      enableSync: false,
      btnType: <NotificationSyncDisabled />,
      snackBar: {
        preview: false,
        vertical: "bottom",
        horizontal: "center",
        message: ""
      },
      anchorEl: null
    };
    // This will re-size the widget when the glContainer's width and height is changed.
    if (this.props.glContainer != undefined) {
      this.props.glContainer.on("resize", () =>
        this.setState({
          width: this.props.glContainer.width,
          height: this.props.glContainer.height
        })
      );
    }
    // This wil resize the widget when the window width and height is changed.
    window.addEventListener("resize", () => {
      this.setState({
        width: window.innerWidth
      });
    });
  }
  /**
   * Previewing the final date range in the snackbar pop-up
   * @param{String} message : date range
   */
  snackBarPreview(message) {
    const { snackBar } = this.state;
    snackBar.preview = true;
    snackBar.message = `From : ${new Date(message.from)} To ${new Date(
      message.to
    )} `;
    this.setState({ snackBar });
  }

  /**
   * Publishing the selected time on the snackBar
   * @param {String} message : Selected time range
   */
  publishTimeRange = message => {
    super.publish(message);
    this.snackBarPreview(message);
  };

  getDateTimeRangeInfo = () => {
    return super.getGlobalState("dtrp");
  };
  /**
   * Handle granularity change for the quickranges
   * @param{String} mode: custom or !custom
   */
  handleGranularityChange = mode => {
    this.clearRefreshInterval();
    let granularity = "";
    if (mode !== "custom") {
      const startTimeAndGranularity = this.getStartTimeAndGranularity(mode);
      // granularity = this.verifyDefaultGranularityOfTimeRange(
      //   startTimeAndGranularity.granularity
      // );
      this.publishTimeRange({
        granularity,
        from: startTimeAndGranularity.startTime.getTime(),
        to: new Date().getTime()
      });
      this.setRefreshInterval();
      this.setState({
        granularityMode: mode,
        granularityValue: granularity,
        startTime: startTimeAndGranularity.startTime,
        endTime: new Date()
      });
    }
  };

  /**
   * Handling the granularity change for the customRanges
   * @param{String,object,object,String}:mode,startTime,endTime,granularity
   */
  handleGranularityChangeForCustom = (
    mode,
    startTime,
    endTime,
    granularity
  ) => {
    console.log("mode", typeof granularity);
    typeof this.clearRefreshInterval();
    this.publishTimeRange({
      granularity,
      from: startTime.getTime(),
      to: endTime.getTime()
    });
    this.setState({
      granularityMode: mode,
      granularityValue: granularity,
      startTime: startTime,
      endTime: endTime,
      quickRangeGranularityValue: null,
      customRangeGranularityValue: granularity
    });
  };
  /**
   * Returning the start time and the granularity according to the timeMode
   * @param{String} time mode:'1 minute,15 minute etc
   */

  getStartTimeAndGranularity = granularityValue => {
    let granularity = "";
    let startTime = null;

    switch (granularityValue) {
      case "1 Min":
        startTime = Moment()
          .subtract(1, "minutes")
          .toDate();
        granularity = "minute";
        break;
      case "15 Min":
        startTime = Moment()
          .subtract(15, "minutes")
          .toDate();
        granularity = "minute";
        break;
      case "1 Hour":
        startTime = Moment()
          .subtract(1, "hours")
          .toDate();
        granularity = "minute";
        break;
      case "1 Day":
        startTime = Moment()
          .subtract(1, "days")
          .toDate();
        granularity = "hour";
        break;
      case "7 Days":
        startTime = Moment()
          .subtract(7, "days")
          .toDate();
        granularity = "day";
        break;
      case "1 Month":
        startTime = Moment()
          .subtract(1, "months")
          .toDate();
        granularity = "day";
        break;
      case "3 Months":
        startTime = Moment()
          .subtract(3, "months")
          .toDate();
        granularity = "month";
        break;
      case "6 Months":
        startTime = Moment()
          .subtract(6, "months")
          .toDate();
        granularity = "month";
        break;
      case "1 Year":
        startTime = Moment()
          .subtract(1, "years")
          .toDate();
        granularity = "month";
        break;
      default:
      // do nothing
    }
    return { startTime, granularity };
  };

  // verifyDefaultGranularityOfTimeRange = (granularity) => {
  //   const availableGranularities = this.getAvailableGranularities();
  //   if (
  //     availableGranularities.indexOf(
  //       this.capitalizeCaseFirstChar(granularity)
  //     ) > -1
  //   ) {
  //     return granularity;
  //   }
  //   return availableGranularities[0].toLowerCase();
  // }

  /**
   *  Generating the views ('1 min ,'15 min' etc) according to default time range
   * @returns {Array} : sorted views
   *    */
  getDefaultTimeRange = () => {
    const { options } = this.state;
    const defaultTimeRange = options.defaultValue || "3 Months";
    const minGranularity = options.availableGranularities || "From Second";
    let availableViews = [];
    switch (minGranularity) {
      case "From Second":
      case "From Minute":
        availableViews = [
          "1 Min",
          "15 Min",
          "1 Hour",
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Hour":
        availableViews = [
          "1 Hour",
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Day":
        availableViews = [
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Month":
        availableViews = ["1 Month", "3 Months", "6 Months", "1 Year"];
        break;
      case "From Year":
        availableViews = ["1 Year"];
        break;
      default:
      // do nothing
    }

    if (availableViews.indexOf(defaultTimeRange) > -1) {
      return defaultTimeRange;
    }
    return availableViews[0];
  };

  /**
   * Loading the default time range
   */
  loadDefaultTimeRange = () => {
    const dateTimeRangeInfo = this.getDateTimeRangeInfo();
    if (dateTimeRangeInfo.tr) {
      if (dateTimeRangeInfo.tr.toLowerCase() === "custom") {
        if (dateTimeRangeInfo.sd && dateTimeRangeInfo.ed) {
          if (dateTimeRangeInfo.g) {
            this.loadUserSpecifiedCustomTimeRange(
              dateTimeRangeInfo.sd,
              dateTimeRangeInfo.ed,
              dateTimeRangeInfo.g
            );
          } else {
            this.loadUserSpecifiedCustomTimeRange(
              dateTimeRangeInfo.sd,
              dateTimeRangeInfo.ed,
              ""
            );
          }
        } else {
          this.handleGranularityChange(this.getDefaultTimeRange());
        }
      } else {
        if (dateTimeRangeInfo.sync) {
          this.setState({
            enableSync: true,
            btnType: <NotificationSync />
          });
        }
        if (dateTimeRangeInfo.g) {
          this.loadUserSpecifiedTimeRange(
            dateTimeRangeInfo.tr,
            dateTimeRangeInfo.g
          );
        } else {
          this.loadUserSpecifiedTimeRange(dateTimeRangeInfo.tr, "");
        }
      }
    } else {
      this.handleGranularityChange(this.getDefaultTimeRange());
    }
  };

  loadUserSpecifiedCustomTimeRange = (start, end, granularity) => {
    const startAndEndTime = this.formatTimeRangeDetails(start, end);
    if (startAndEndTime != null) {
      this.clearRefreshInterval();
      if (
        granularity.length === 0 ||
        this.getSupportedGranularitiesForCustom(
          startAndEndTime.startTime,
          startAndEndTime.endTime
        ).indexOf(granularity) === -1
      ) {
        granularity = this.getAvailableGranularities()[0].toLowerCase();
      }
      this.publishTimeRange({
        granularity,
        from: startAndEndTime.startTime,
        to: startAndEndTime.endTime
      });
      this.setState({
        granularityMode: "custom",
        granularityValue: granularity,
        startTime: Moment(startAndEndTime.startTime).toDate(),
        endTime: Moment(startAndEndTime.endTime).toDate()
      });
    } else {
      this.handleGranularityChange(this.getDefaultTimeRange());
    }
  };

  loadUserSpecifiedTimeRange = (range, granularity) => {
    const timeRange = this.getTimeRangeName(range);
    if (timeRange.length > 0) {
      const supportedTimeRanges = this.getSupportedTimeRanges();
      if (supportedTimeRanges.indexOf(timeRange) > -1) {
        if (granularity.length > 0) {
          this.clearRefreshInterval();
          granularity = granularity.toLowerCase();
          const supportedGranularities = this.getSupportedGranularitiesForFixed(
            timeRange
          );
          if (
            supportedGranularities.indexOf(
              this.capitalizeCaseFirstChar(granularity)
            ) > -1
          ) {
            const availableGranularities = this.getAvailableGranularities();
            if (
              availableGranularities.indexOf(
                this.capitalizeCaseFirstChar(granularity)
              ) === -1
            ) {
              granularity = availableGranularities[0].toLowerCase();
            }
          } else {
            granularity = supportedGranularities[
              supportedGranularities.length - 1
            ].toLowerCase();
          }
          const startTimeAndDefaultGranularity = this.getStartTimeAndGranularity(
            timeRange
          );
          this.publishTimeRange({
            granularity,
            from: startTimeAndDefaultGranularity.startTime.getTime(),
            to: new Date().getTime()
          });
          this.setState({
            granularityMode: timeRange,
            granularityValue: granularity,
            startTime: startTimeAndDefaultGranularity.startTime,
            endTime: new Date()
          });
          this.setRefreshInterval();
        } else {
          this.handleGranularityChange(timeRange);
        }
      } else {
        this.handleGranularityChange(supportedTimeRanges[0]);
      }
    } else {
      this.handleGranularityChange(this.getDefaultTimeRange());
    }
  };

  getTimeRangeName = timeRange => {
    let name = "";
    if (timeRange) {
      const rangeParts = timeRange.toLowerCase().match(/[0-9]+|[a-z]+/g) || [];
      if (rangeParts.length === 2) {
        switch (`${rangeParts[0]} ${rangeParts[1]}`) {
          case "1 min":
            name = "1 Min";
            break;
          case "15 min":
            name = "15 Min";
            break;
          case "1 hour":
            name = "1 Hour";
            break;
          case "1 day":
            name = "1 Day";
            break;
          case "7 days":
            name = "7 Days";
            break;
          case "1 month":
            name = "1 Month";
            break;
          case "3 months":
            name = "3 Months";
            break;
          case "6 months":
            name = "6 Months";
            break;
          case "1 year":
            name = "1 Year";
            break;
          default:
          // do nothing
        }
      }
    }
    return name;
  };

  formatTimeRangeDetails = (startTime, endTime) => {
    let start = null;
    let end = null;
    let result = null;

    const startTimeFormat = this.getDateTimeFormat(startTime);
    const endTimeFormat = this.getDateTimeFormat(endTime);

    if (startTimeFormat != null && endTimeFormat != null) {
      start = Moment(startTime, startTimeFormat).valueOf();
      end = Moment(endTime, endTimeFormat).valueOf();
      if (start !== "Invalid date" && end !== "Invalid date") {
        result = { startTime: start, endTime: end };
      }
    }
    return result;
  };

  getDateTimeFormat = dateTime => {
    const dateTimeParts = dateTime.split(" ");

    let timeFormat = null;
    if (dateTimeParts.length === 3) {
      timeFormat = "hh:mm:ss A";
    } else if (dateTimeParts.length === 2) {
      timeFormat = "hh:mm:ss";
    } else if (dateTimeParts.length === 1) {
      timeFormat = null;
    }

    let dateDelimiter = "";
    if (
      (dateTimeParts[0].match(/-/g) || []).length > 0 &&
      (dateTimeParts[0].match(/\./g) || []).length === 0 &&
      (dateTimeParts[0].match(/\//g) || []).length === 0
    ) {
      dateDelimiter = "-";
    } else if (
      (dateTimeParts[0].match(/\./g) || []).length > 0 &&
      (dateTimeParts[0].match(/-/g) || []).length === 0 &&
      (dateTimeParts[0].match(/\//g) || []).length === 0
    ) {
      dateDelimiter = ".";
    } else if (
      (dateTimeParts[0].match(/\//g) || []).length > 0 &&
      (dateTimeParts[0].match(/-/g) || []).length === 0 &&
      (dateTimeParts[0].match(/\./g) || []).length === 0
    ) {
      dateDelimiter = "/";
    } else {
      dateDelimiter = null;
    }

    let dateFormat = null;
    if (dateDelimiter != null) {
      const dateParts = dateTimeParts[0].split(dateDelimiter);
      if (dateParts.length === 2) {
        let monthFormat = "MMMM";
        if (dateParts[1].length === 3) {
          monthFormat = "MMMM";
        }
        dateFormat = `${monthFormat + dateDelimiter}YYYY`;
      } else if (dateParts.length === 3) {
        let monthFormat = "MMM";
        if (dateParts[1].length === 3) {
          monthFormat = "MMMM";
        }
        dateFormat =
          "YYYY" + dateDelimiter + monthFormat + dateDelimiter + "DD";
      }
    } else {
      dateFormat = "YYYY";
    }

    if (dateFormat != null) {
      if (timeFormat != null) {
        return `${dateFormat} ${timeFormat}`;
      }
      return dateFormat;
    }
    return null;
  };

  timestampToDateFormat = (timestamp, granularityMode) => {
    const format = this.getStandardDateTimeFormat(granularityMode);
    if (format.length > 0) {
      return Moment.unix(timestamp).format(format);
    }
    return "";
  };

  /**in here granularity granularityValue is second,minute,hour */
  getStandardDateTimeFormat = granularitValue => {
    granularitValue = granularitValue.toLowerCase();
    let format = "";
    if (granularitValue.indexOf("second") > -1) {
      format = "YYYY-MMMM-DD hh:mm:ss A";
    } else if (granularitValue.indexOf("minute") > -1) {
      format = "YYYY-MMMM-DD hh:mm A";
    } else if (granularitValue.indexOf("hour") > -1) {
      format = "YYYY-MMMM-DD hh:00 A";
    } else if (granularitValue.indexOf("day") > -1) {
      format = "YYYY-MMMM-DD";
    } else if (granularitValue.indexOf("month") > -1) {
      format = "YYYY-MMMM";
    } else if (granularitValue.indexOf("year") > -1) {
      format = "YYYY";
    }
    return format;
  };

  componentDidMount() {
    this.loadDefaultTimeRange();
  }

  componentWillUnmount() {
    clearInterval(this.state.refreshIntervalId);
  }

  componentDidUpdate() {
    const snackBar = this.state.snackBar;
    snackBar.preview = false;
    if (snackBar.preview === true) this.setState({ snackBar });
  }

  /**
   * @returns{JSX}
   */
  render() {
    const { granularityMode } = this.state;
    // const { width, height } = this.props.glContainer;
    // let styleWrapper = { backgroundColor: "#1a262e", color: "white" };
    if (this.props.muiTheme) {
      if (this.props.muiTheme.name === "light") {
        styleWrapper = { backgroundColor: "#ffffff", color: "black" };
      }
    }

    return (
      <MuiThemeProvider
        theme={this.props.muiTheme.name === "dark" ? dark : light}
      >
        <div>
          {this.renderSnackBar()}
          <div style={{ float: "right", marginTop: 2, marginRight: 23 }}>
            {this.getCustomRangePopover()}
            {this.getTimeIntervalDescriptor(granularityMode)}
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
  //handling the closing and opening events of the popover
  popoverHandler = event => {
    this.setState({
      anchorEl: event.currentTarget
    });
  };
  // closing the popover when selecting quickRanges,applying customRange date value,outside mouse click
  popoverClose = () => {
    this.setState({
      anchorEl: null
    });
  };
  //showing the popover
  getCustomRangePopover() {
    const {
      anchorEl,
      customRangeGranularityValue,
      quickRangeGranularityValue,
      startTime,
      endTime,
      options
    } = this.state;
    const { muiTheme } = this.props;
    const open = Boolean(anchorEl);
    if (open) {
      return (
        <DateTimePopper
          onClose={this.popoverClose}
          anchorEl={anchorEl}
          open={open}
          options={options}
          onChangeCustom={this.handleGranularityChangeForCustom}
          getDateTimeRangeInfo={this.getDateTimeRangeInfo}
          getDefaultTimeRange={this.getDefaultTimeRange}
          changeQuickRangeGranularities={this.changeQuickRangeGranularities}
          theme={muiTheme}
          startTime={startTime}
          endTime={endTime}
          customRangeGranularityValue={customRangeGranularityValue}
          quickRangeGranularityValue={quickRangeGranularityValue}
        />
      );
    }
  }
  /**
   * Shows the final output of the selected date time range
   * @param{String} custom or !custom
   */
  getTimeIntervalDescriptor = granularityMode => {
    let startAndEnd = {
      startTime: null,
      endTime: null
    };
    if (granularityMode !== "custom") {
      startAndEnd = this.getStartTimeAndEndTimeForTimeIntervalDescriptor(
        granularityMode
      );
    } else if (
      granularityMode === "custom" &&
      this.state.startTime &&
      this.state.endTime
    ) {
      startAndEnd.startTime = this.timestampToDateFormat(
        this.state.startTime.getTime() / 1000,
        this.state.granularityValue
      );
      startAndEnd.endTime = this.timestampToDateFormat(
        this.state.endTime.getTime() / 1000,
        this.state.granularityValue
      );
    }

    const { startTime, endTime } = startAndEnd;
    const timeRange = " " + startTime + "  - " + endTime;
    if (granularityMode && startTime && endTime) {
      this.setQueryParamToURL(
        granularityMode.replace(" ", "").toLowerCase(),
        startTime.toLowerCase(),
        endTime.toLowerCase(),
        this.state.granularityValue,
        this.state.enableSync
      );
      return (
        <div
          style={{
            width: "100%",
            marginTop: 15,
            marginRight: 10,
            backgroundColor:
              this.props.muiTheme.name === "dark" ? "#2b2b2b" : "#e8e8e8"
          }}
        >
          <Button onClick={this.popoverHandler} style={{ fontSize: 16 }}>
            <span style={{ paddingRight: 10 }}>
              <DateRange style={{ fontSize: 17 }} />
            </span>
            {`  ${timeRange} `}
            <i style={{ paddingLeft: 5, paddingRight: 5 }}> per</i>
            {this.getDefaultSelectedOption()}
          </Button>
          <Button onClick={this.autoSyncClick}>{this.state.btnType}</Button>
        </div>
      );
    }
    return null;
  };

  /**
   * Returning the calculated startTime and endTime according to the selected granularity
   * @param{String} granularityValue:'1 minute', '15 minute','1 hour' etc
   */
  getStartTimeAndEndTimeForTimeIntervalDescriptor = granularityValue => {
    let startTime = null;
    let endTime = null;

    switch (granularityValue) {
      case "1 Min":
        startTime = Moment()
          .subtract(1, "minutes")
          .format("YYYY-MMMM-DD hh:mm:ss A");
        endTime = Moment().format("YYYY-MMMM-DD hh:mm:ss A");
        break;
      case "15 Min":
        startTime = Moment()
          .subtract(15, "minutes")
          .format("YYYY-MMMM-DD hh:mm:ss A");
        endTime = Moment().format("YYYY-MMMM-DD hh:mm:ss A");
        break;
      case "1 Hour":
        startTime = Moment()
          .subtract(1, "hours")
          .format("YYYY-MMMM-DD hh:mm A");
        endTime = Moment().format("YYYY-MMMM-DD hh:mm  A");
        break;
      case "1 Day":
        startTime = Moment()
          .subtract(1, "days")
          .format("YYYY-MMMM-DD hh:00 A");
        endTime = Moment().format("YYYY-MMMM-DD hh:00 A");
        break;
      case "7 Days":
        startTime = Moment()
          .subtract(7, "days")
          .format("YYYY-MMMM-DD hh:00 A");
        endTime = Moment().format("YYYY-MMMM-DD hh:00 A");
        break;
      case "1 Month":
        startTime = Moment()
          .subtract(1, "months")
          .format("YYYY-MMMM-DD");
        endTime = Moment().format("YYYY-MMMM-DD");
        break;
      case "3 Months":
        startTime = Moment()
          .subtract(3, "months")
          .format("YYYY-MMMM-DD");
        endTime = Moment().format("YYYY-MMMM-DD");
        break;
      case "6 Months":
        startTime = Moment()
          .subtract(6, "months")
          .format("YYYY-MMMM-DD");
        endTime = Moment().format("YYYY-MMMM-DD");
        break;
      case "1 Year":
        startTime = Moment()
          .subtract(1, "years")
          .format("YYYY");
        endTime = Moment().format("YYYY");
        break;
      default:
      // do nothing
    }
    return { startTime, endTime };
  };

  /**
   * Showing up the snack bar which will appear on the bottom of the screen
   * by publishing the selected time ranges
   */
  renderSnackBar() {
    const { preview } = this.state.snackBar;
    return (
      <Snackbar
        open={preview}
        autoHideDuration={4000}
        onClose={() => {
          const { snackBar } = this.state;
          snackBar.preview = false;
          this.setState({ snackBar });
        }}
        ContentProps={{
          "aria-describedby": "message-id"
        }}
        message={
          <div style={{ alignContent: "center" }} id="message-id">
            {this.state.snackBar.message}
          </div>
        }
      />
    );
  }
  /**
   * Shows the granularity value for the selected time range
   * Example:When user select 1hour it shows  granularity as 'per minute'
   */
  getDefaultSelectedOption() {
    if (this.state.granularityMode === "custom") {
      return this.verifySelectedGranularityForCustom(
        this.state.granularityValue
      );
    }
    const { granularityMode } = this.state;
    let defaultSelectedGranularity = this.getSupportedGranularitiesForFixed(
      granularityMode
    );
    return defaultSelectedGranularity[
      defaultSelectedGranularity.length - 2
    ].toLowerCase();
  }

  verifySelectedGranularityForCustom = granularity => {
    if (
      this.getSupportedGranularitiesForCustom(
        this.state.startTime,
        this.state.endTime
      ).indexOf(this.capitalizeCaseFirstChar(granularity)) > -1
    ) {
      return granularity;
    }
    return "";
  };

  /**
   * Changing the final date time out-put's granularity value and the custom range
   * granularity value according to the selected quickRange value
   * @param{String} granularityValue
   */
  changeQuickRangeGranularities = granularityValue => {
    this.handleGranularityChange(granularityValue);
    let customRangeGranularityValue = "";
    switch (granularityValue) {
      case "1 Min":
      case "15 Min":
        customRangeGranularityValue = "second";
        break;
      case "1 Hour":
        customRangeGranularityValue = "minute";
        break;
      case "1 Day":
      case "7 Days":
        customRangeGranularityValue = "hour";
        break;
      case "1 Month":
      case "3 Months":
      case "6 Months":
        customRangeGranularityValue = "day";
        break;
      case "1 Year":
        customRangeGranularityValue = "month";
        break;
      default:
    }
    this.setState({
      granularityMode: granularityValue,
      anchorEl: null,
      customRangeGranularityValue: customRangeGranularityValue,
      quickRangeGranularityValue: granularityValue
    });
  };

  capitalizeCaseFirstChar = str => {
    let result = "";
    if (str) {
      result = str.charAt(0).toUpperCase() + str.slice(1);
    }
    return result;
  };

  getSupportedTimeRanges = () => {
    const minGranularity =
      this.state.options.availableGranularities || "From Second";
    let timeRanges = [];
    switch (minGranularity) {
      case "From Second":
      case "From Minute":
        timeRanges = [
          "1 Min",
          "15 Min",
          "1 Hour",
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Hour":
        timeRanges = [
          "1 Hour",
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Day":
        timeRanges = [
          "1 Day",
          "7 Days",
          "1 Month",
          "3 Months",
          "6 Months",
          "1 Year"
        ];
        break;
      case "From Month":
        timeRanges = ["1 Month", "3 Months", "6 Months", "1 Year"];
        break;
      case "From Year":
        timeRanges = ["1 Year"];
        break;
      default:
      // do nothing
    }
    return timeRanges;
  };

  getAvailableGranularities = () => {
    const minGranularity =
      this.state.options.availableGranularities || "From Second";
    let granularities = [];
    switch (minGranularity) {
      case "From Second":
        granularities = ["Second", "Minute", "Hour", "Day", "Month", "Year"];
        break;
      case "From Minute":
        granularities = ["Minute", "Hour", "Day", "Month", "Year"];
        break;
      case "From Hour":
        granularities = ["Hour", "Day", "Month", "Year"];
        break;
      case "From Day":
        granularities = ["Day", "Month", "Year"];
        break;
      case "From Month":
        granularities = ["Month", "Year"];
        break;
      case "From Year":
        granularities = ["Year"];
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
  getSupportedGranularitiesForFixed = granularityValue => {
    let supportedGranularities = [];
    switch (granularityValue) {
      case "1 Min":
      case "15 Min":
        supportedGranularities = ["Second", "Minute"];
        break;
      case "1 Hour":
        supportedGranularities = ["Second", "Minute", "Hour"];
        break;
      case "1 Day":
      case "7 Days":
        supportedGranularities = ["Second", "Minute", "Hour", "Day"];
        break;
      case "1 Month":
      case "3 Months":
      case "6 Months":
        supportedGranularities = ["Second", "Minute", "Hour", "Day", "Month"];
        break;
      case "1 Year":
        supportedGranularities = [
          "Second",
          "Minute",
          "Hour",
          "Day",
          "Month",
          "Year"
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

    if (end.diff(start, "seconds") !== 0) {
      supportedGranularities.push("Second");
    }
    if (end.diff(start, "minutes") !== 0) {
      supportedGranularities.push("Minute");
    }
    if (end.diff(start, "hours") !== 0) {
      supportedGranularities.push("Hour");
    }
    if (end.diff(start, "days") !== 0) {
      supportedGranularities.push("Day");
    }
    if (end.diff(start, "months") !== 0) {
      supportedGranularities.push("Month");
    }
    if (end.diff(start, "years") !== 0) {
      supportedGranularities.push("Year");
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
          enableSync: true,
          btnType: <NotificationSync style={{ color: "#ef6c00" }} />
        },
        this.setRefreshInterval
      );
    } else {
      this.setState({
        enableSync: false,
        btnType: <NotificationSyncDisabled />
      });
      this.clearRefreshInterval();
    }
  };
  /**
   * Setting a refresh interval for syncing the time
   */
  setRefreshInterval = () => {
    if (this.state.enableSync) {
      const refreshInterval =
        this.state.options.autoSyncInterval * 1000 || 10000;
      const refresh = () => {
        const startTimeAndGranularity = this.getStartTimeAndGranularity(
          this.state.granularityMode
        );
        this.publishTimeRange({
          granularity: this.state.granularityValue,
          from: startTimeAndGranularity.startTime.getTime(),
          to: new Date().getTime()
        });
      };
      const intervalID = setInterval(refresh, refreshInterval);
      this.setState({
        refreshIntervalId: intervalID,
        endTime: new Date()
      });
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
   * @param {String} granularity : granularity type 'second','minute'
   * @pram {Boolean} autoSync
   */
  setQueryParamToURL = (
    timeRange,
    startTime,
    endTime,
    granularity,
    autoSync
  ) => {
    super.setGlobalState("dtrp", {
      tr: timeRange,
      sd: startTime,
      ed: endTime,
      g: granularity,
      sync: autoSync
    });
  };
}

if (global.dashboard != undefined) {
  global.dashboard.registerWidget(widgetConf.id, DateTimePicker);
}
