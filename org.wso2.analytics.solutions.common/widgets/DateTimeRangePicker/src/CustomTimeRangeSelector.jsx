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
import {MenuItem, SelectField, RaisedButton} from 'material-ui';
import DateTimePicker from './DateTimePicker';

export default class CustomTimeRangeSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputType: this.getDefaultGranularity()
        };

        this.startTime = new Date();
        this.endTime = new Date();
        this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
        this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
        this.generateGranularityMenuItems = this.generateGranularityMenuItems.bind(this);
        this.lowerCaseFirstChar = this.lowerCaseFirstChar.bind(this);
        this.getSelectedGranularities = this.getSelectedGranularities.bind(this);
        this.getDefaultGranularity = this.getDefaultGranularity.bind(this);
        this.publishCustomTimeRange = this.publishCustomTimeRange.bind(this);
    }

    handleStartTimeChange(date) {
        this.startTime = date;
    }

    handleEndTimeChange(date) {
        this.endTime = date;
    }

    generateGranularityMenuItems() {
        return (this.getSelectedGranularities()).map((view) =>
            <MenuItem
                value={this.lowerCaseFirstChar(view)}
                primaryText={view}/>);
    }

    lowerCaseFirstChar(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    getSelectedGranularities() {
        let minGranularity = this.props.options['availableGranularities'];
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
        }
        return granularities;
    }

    getDefaultGranularity() {
        let minGranularity = this.props.options['availableGranularities'];
        let defaultGranularity = '';
        switch (minGranularity) {
            case 'From Second':
                defaultGranularity = 'second';
                break;
            case 'From Minute':
                defaultGranularity = 'minute';
                break;
            case 'From Hour':
                defaultGranularity = 'hour';
                break;
            case 'From Day':
                defaultGranularity = 'day';
                break;
            case 'From Month':
                defaultGranularity = 'month';
                break;
            case 'From Year':
                defaultGranularity = 'year';
                break;
        }
        return defaultGranularity;
    }

    publishCustomTimeRange() {
        let {handleClose, onChangeCustom} = this.props;
        handleClose();
        onChangeCustom('custom', this.startTime, this.endTime, this.state.inputType)
    }

    render() {

        return (
            <div
                style={{marginTop: 10}}>
                <div
                    style={{
                        width: '100%',
                        marginBottom: 10
                    }}>
                    Per<br/>
                    <SelectField
                        className={'perUnderline'}
                        value={this.state.inputType}
                        onChange={(event, index, value) => {
                            this.setState({inputType: value});
                        }}>
                        {this.generateGranularityMenuItems()}
                    </SelectField>
                </div>
                <div
                    style={{minWidth: 420}}>
                    <div
                        style={{
                            width: '50%',
                            float: 'left',
                        }}>
                        From
                        <br/>
                        <DateTimePicker
                            onChange={this.handleStartTimeChange}
                            inputType={this.state.inputType}/>
                    </div>
                    <div
                        style={{
                            width: '50%',
                            float: 'right',
                        }}>
                        To
                        <br/>
                        <DateTimePicker
                            onChange={this.handleEndTimeChange}
                            inputType={this.state.inputType}/>
                    </div>
                </div>
                <RaisedButton
                    primary={true}
                    style={{
                        marginTop: 10,
                        marginBottom: 10,
                        float: 'right'
                    }}
                    onClick={this.publishCustomTimeRange}>
                    Apply
                </RaisedButton>
            </div>
        )
    }
}
