/* eslint-disable react/prop-types,comma-dangle */
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
import { MenuItem, SelectField } from 'material-ui';
import moment from 'moment';

export default class DateTimePicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            days: new Date().getDate(),
            time: moment().format('HH:mm:ss.SSS'),
        };

        this.generateDays = this.generateDays.bind(this);
        this.generateMonths = this.generateMonths.bind(this);
        this.generateYears = this.generateYears.bind(this);
    }

    getTimeStep(inputType) {
        switch (inputType) {
            case 'hour':
                return 3600;
            case 'minute':
                return 60;
            case 'second':
                return 1;
            default:
                return '';
        }
    }

    getTimeString(inputType) {
        switch (inputType) {
            case 'hour':
                return moment().format('HH:00:00.000');
            case 'minute':
                return moment().format('HH:mm:00.000');
            case 'second':
                return moment().format('HH:mm:ss.000');
            default:
                return '';
        }
    }

    isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    generateDays(year, month) {
        const dayComponents = [];
        let days = 0;

        if (month === 1) {
            if (this.isLeapYear(year)) days = 29;
            else days = 28;
        } else if ((month < 7 && ((month + 1) % 2 === 1)) || (month > 6 && ((month + 1) % 2 === 0))) {
            days = 31;
        } else {
            days = 30;
        }

        for (let i = 1; i <= days; i++) {
            dayComponents.push(
                <MenuItem
                    key={`$days-${i}`}
                    value={i}
                    primaryText={i}
                />
            );
        }

        return dayComponents;
    }

    generateMonths() {
        const monthComponents = [];
        const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'];

        for (let i = 0; i < monthArray.length; i++) {
            monthComponents.push(
                <MenuItem
                    key={`month-${i}`}
                    value={i}
                    primaryText={monthArray[i]}
                />
            );
        }

        return monthComponents;
    }

    generateYears() {
        const yearArray = [];

        for (let index = 1970; index <= 2099; index++) {
            yearArray.push(
                <MenuItem
                    key={`year-${index}`}
                    value={index}
                    primaryText={index}
                />
            );
        }

        return yearArray;
    }

    handleOnChange(property, value) {
        const { inputType, onChange } = this.props;
        const { state } = this;

        state[property] = value;
        const date = moment(`${state.year}:${(state.month + 1)}:${state.days} ${state.time}`,
            'YYYY-MM-DD HH:mm:ss.SSS').toDate();

        switch (inputType) {
            case 'year':
                date.setMonth(0);
                break;
            case 'month':
                date.setDate(1);
                break;
            case 'day':
                date.setHours(0);
                break;
            case 'hour':
                date.setMinutes(0);
                break;
            case 'minute':
                date.setSeconds(0);
                break;
            case 'second':
                date.setMilliseconds(0);
                break;
            default:
            //  do nothing
        }

        this.setState(state);

        return onChange && onChange(date);
    }

    render() {
        const { year, month, days } = this.state;
        let { time } = this.state;
        const { inputType, theme } = this.props;

        switch (inputType) {
            case 'hour':
                time = moment(time, 'HH:mm').format('HH:00:00.000');
                break;
            case 'minute':
                time = moment(time, 'HH:mm').format('HH:mm:00.000');
                break;
            case 'second':
                time = moment(time, 'HH:mm:ss').format('HH:mm:ss.000');
                break;
            default:
            //  do nothing
        }

        return (
            <div>
                <div
                    style={{ display: 'inline-block' }}
                >
                    {
                        ['year', 'month', 'day', 'hour', 'minute', 'second'].indexOf(inputType) > -1
                            ? (
                                <SelectField
                                    value={year}
                                    onChange={(event, index, value) => {
                                        this.handleOnChange('year', value);
                                    }}
                                >
                                    { this.generateYears() }
                                </SelectField>
                            )
                            : null
                    }
                    {
                        ['month', 'day', 'hour', 'minute', 'second'].indexOf(inputType) > -1
                            ? (
                                <SelectField
                                    value={month}
                                    onChange={(event, index, value) => {
                                        this.handleOnChange('month', value);
                                    }}
                                >
                                    { this.generateMonths() }
                                </SelectField>
                            )
                            : null
                    }
                    {
                        ['day', 'hour', 'minute', 'second'].indexOf(inputType) > -1
                            ? (
                                <SelectField
                                    value={days}
                                    onChange={(event, index, value) => {
                                        this.handleOnChange('days', value);
                                    }}
                                >
                                    { this.generateDays(year, month) }
                                </SelectField>
                            )
                            : null
                    }
                </div>
                {
                    ['hour', 'minute', 'second'].indexOf(inputType) > -1
                        ? (
                            <div>
                                <br />
                                Time
                                <br />
                                <div>
                                    <div>
                                        <input
                                            type='time'
                                            step={this.getTimeStep(inputType)}
                                            value={time}
                                            onChange={(evt) => {
                                                this.handleOnChange('time', evt.target.value);
                                            }}
                                            style={{
                                                color: theme.palette.textColor,
                                                backgroundColor: theme.palette.canvasColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                        : null
                }
            </div>
        );
    }
}
