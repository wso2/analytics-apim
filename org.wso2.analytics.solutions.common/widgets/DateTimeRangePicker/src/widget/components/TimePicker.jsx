/* eslint-disable react/prop-types,comma-dangle */
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
import moment from "moment";
import Select from "@material-ui/core/Select/Select";
import MenuItem from "@material-ui/core/MenuItem/MenuItem";
import Typography from "@material-ui/core/Typography/Typography";
import TextField from "@material-ui/core/TextField/TextField";

export default class TimePicker extends React.Component {
  state = {
    year: this.props.initTime.year(),
    month: this.props.initTime.month(),
    days: this.props.initTime.date(),
    time: this.props.initTime.format("HH:mm:ss.000")
  };

  /**
   * Allowing the time step that user can enter according to the input-type
   * example:If user select hour, user can only change the hour position in the time.
   * @pram{String} inputType:'hour','minute','second'
   * @returns{Integer}
   *
   */
  getTimeStep = (inputType) => {
    switch (inputType) {
      case "hour":
        return 3600;
      case "minute":
        return 60;
      case "second":
        return 1;
      default:
        return "";
    }
  };

  /**
   * Checking the selected year is a leap year or not for calculate
   * days of the month February
   * @param(integer) year
   */
  isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  /**
   * Generating the days according to the inputName ('startTime','endTime')
   * and the StartTime
   * @param(String,String)
   */
  generateDays = (year, month, inputName, startTime) => {
    const dayComponents = [];
    let days = 0;

    if (month === 1) {
      if (this.isLeapYear(year)) days = 29;
      else days = 28;
    } else if (
      (month < 7 && (month + 1) % 2 === 1) ||
      (month > 6 && (month + 1) % 2 === 0)
    ) {
      days = 31;
    } else {
      days = 30;
    }

    if (inputName === "startTime") {
      for (let i = 1; i <= days; i++) {
        dayComponents.push(
          <MenuItem key={`$days-${i}`} value={i} children={i} />
        );
      }
    } else if (inputName === "endTime") {
      if (moment(startTime).month() === this.state.month) {
        const startDate = moment(startTime).date();
        for (let i = startDate; i <= days; i++) {
          dayComponents.push(
            <MenuItem key={`$days-${i}`} value={i} children={i} />
          );
        }
        if (this.state.days < startDate) {
          this.setState({ days: startDate + 1 });
          this.handleOnChange("days", startDate + 1);
        }
      } else {
        for (let i = 1; i <= days; i++) {
          dayComponents.push(
            <MenuItem key={`$days-${i}`} value={i} children={i} />
          );
        }
      }
    }

    return dayComponents;
  };

  /**
   * Generating the months according to the inputName ('startTime','endTime')
   * and the StartTime
   * @param(String,String)
   */
  generateMonths = (inputName, startTime) => {
    const monthComponents = [];
    const monthArray = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    if (inputName === "startTime") {
      for (let i = 0; i < monthArray.length; i++) {
        monthComponents.push(
          <MenuItem key={`month-${i}`} value={i} children={monthArray[i]} />
        );
      }
    } else if (inputName === "endTime") {
      const start = moment(startTime);
      const yearDiff = this.state.year - start.year();
      if (yearDiff <= 0) {
        const startMonth = start.month();
        for (let i = startMonth; i < monthArray.length; i++) {
          monthComponents.push(
            <MenuItem key={`month-${i}`} value={i} children={monthArray[i]} />
          );
        }
        if (this.state.month < startMonth) {
          this.setState({ month: startMonth });
          this.handleOnChange("month", startMonth);
        }
      } else if (yearDiff > 0) {
        for (let i = 0; i < monthArray.length; i++) {
          monthComponents.push(
            <MenuItem key={`month-${i}`} value={i} children={monthArray[i]} />
          );
        }
      }
    }

    return monthComponents;
  };

  /**
   * Generating the years according to the inputName ('startTime','endTime')
   * and the StartTime
   * @param(String,String)
   */
  generateYears = (inputName, startTime) => {
    const yearArray = [];
    if (inputName === "startTime") {
      for (let index = 1970; index <= 2099; index++) {
        yearArray.push(
          <MenuItem key={`year-${index}`} value={index} children={index} />
        );
      }
    } else if (inputName === "endTime") {
      const startYear = moment(startTime).year();
      for (let index = startYear; index <= 2099; index++) {
        yearArray.push(
          <MenuItem key={`year-${index}`} value={index} children={index} />
        );
      }

      if (this.state.year < startYear) {
        this.setState({ year: startYear });
        this.handleOnChange("year", startYear);
      }
    }
    return yearArray;
  };

  /**
   * Change the values of 'year' ,'month','day','hour','minute',
   * 'second' when selecting.
   * param{String,event} (property,value)
   */
  handleOnChange = (property, value) => {
    const { inputType, onChange, disableSelectedQuickRangeValue } = this.props;
    disableSelectedQuickRangeValue()
    const { state } = this;
    state[property] = value;

    const date = moment(
      `${state.year}:${state.month + 1}:${state.days} ${state.time}`,
      "YYYY-MM-DD HH:mm:ss.000"
    ).toDate();

    switch (inputType) {
      case "year":
        date.setMonth(0);
        break;
      case "month":
        date.setDate(1);
        break;
      case "day":
        date.setHours(0);
        break;
      case "hour":
        date.setMinutes(0);
        break;
      case "minute":
        date.setSeconds(0);
        break;
      case "second":
        date.setMilliseconds(0);
        break;
      default:
      //  do nothing
    }
    this.setState(state);
    return onChange && onChange(date);
  };
  /**
   * @returns{JSX}
   */
  render() {
    const { year, month, days } = this.state;
    let { time } = this.state;
    const { inputType, theme, inputName, startTime } = this.props;
    switch (inputType) {
      case "hour":
        time = moment(time, "HH:mm").format("HH:00:00.000");
        break;
      case "minute":
        time = moment(time, "HH:mm").format("HH:mm:00.000");
        break;
      case "second":
        time = moment(time, "HH:mm:ss").format("HH:mm:ss.000");
        break;
      default:
      //  do nothing
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["year", "month", "day", "hour", "minute", "second"].indexOf(
            inputType
          ) > -1 ? (
              <Select
                value={year}
                onChange={event => {
                  this.handleOnChange("year", event.target.value);
                }}
              >
                {this.generateYears(inputName, startTime)}
              </Select>
            ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["month", "day", "hour", "minute", "second"].indexOf(inputType) >
            -1 ? (
              <Select
                value={month}
                onChange={event => {
                  this.handleOnChange("month", event.target.value);
                }}
              >
                {this.generateMonths(inputName, startTime)}
              </Select>
            ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["day", "hour", "minute", "second"].indexOf(inputType) > -1 ? (
            <Select
              value={days}
              onChange={event => {
                this.handleOnChange("days", event.target.value);
              }}
            >
              {this.generateDays(year, month, inputName, startTime)}
            </Select>
          ) : null}
        </div>
        {["hour", "minute", "second"].indexOf(inputType) > -1 ? (
          <div
            style={{ display: "flex", flexDirection: "column", marginTop: 20 }}
          >
            <Typography
              style={{
                fontSize: 12,
                color: theme.name === "dark" ? "#ffffff" : "#000"
              }}
            >
              Time
            </Typography>
            <TextField
              style={{ width: 140 }}
              type="time"
              onChange={evt => {
                this.handleOnChange("time", evt.target.value);
              }}
              value={time}
              inputProps={{ step: this.getTimeStep(inputType) }}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

