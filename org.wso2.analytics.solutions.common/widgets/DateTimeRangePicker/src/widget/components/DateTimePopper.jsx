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

import React from "react";
import CustomTimeRangeSelector from "./CustomTimeRangeSelector";
import Popover from "@material-ui/core/Popover/Popover";
import Grid from "@material-ui/core/Grid/Grid";
import Button from "@material-ui/core/Button/Button";
import Typography from "@material-ui/core/Typography/Typography";
const DateTimePopper = (props) => {
  const quickRangeButtons = [
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
    disableSelectedQuickRangeValue
  } = props;

  const quickRanges = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    marginTop: 8,
    marginRight: 17,
    marginBottom: 1,
    borderRightStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: theme.name === "dark" ? "#111618" : "#d8d0d0",
    backgroundColor: theme.name === "dark" ? " #333435" : "#ffffff",
    height: 397
  };
  const customRanges = {
    marginTop: 8,
    marginRight: 2,
    marginLeft: -17,
    height: 397,
    backgroundColor: theme.name === "dark" ? "#333435" : "#ffffff"
  };
  const RangeHeader = {
    fontSize: 14,
    padding: 0.5,
    margin: 4,
    color: theme.name === "dark" ? "#ffffff" : "#000"
  };
  return (
    <Popover
      id={"popper"}
      open={open}
      anchorEl={anchorPopperButton}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left"
      }}
      transitionDuration="auto"
      style={{ height: 550 }}
    >
      <Grid container style={{ maxWidth: 520, height: 410 }}>
        <Grid item xs={3}>
          <div style={quickRanges}>
            <Typography style={RangeHeader}>Quick Ranges</Typography>
            {quickRangeButtons.map((quickRangeButton, index) => (
              <Button
                size="large"
                key={index}
                onClick={() => changeQuickRangeGranularities(quickRangeButton)}
                style={{
                  border: 0,
                  padding: 0,
                  fontSize: 10,
                  backgroundColor:
                    theme.name === "dark"
                      ? quickRangeGranularityValue === quickRangeButton
                        ? "#505050"
                        : "#323435"
                      : quickRangeGranularityValue === quickRangeButton
                        ? "#e9e8e8"
                        : "#ffffff"
                }}
              >
                {quickRangeButton}
              </Button>
            ))}
          </div>
        </Grid>
        <Grid item xs={9}>
          <div style={customRanges}>
            <Typography
              style={{
                ...RangeHeader,
                alignContent: "center",
                marginTop: 13,
                marginLeft: 18
              }}
            >
              Custom Ranges
            </Typography>
            <Typography
              style={{
                ...RangeHeader,
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
};
export default DateTimePopper;

