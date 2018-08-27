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
import {IconButton, FlatButton, Popover, Menu} from 'material-ui';
import {HardwareKeyboardArrowRight, HardwareKeyboardArrowLeft} from 'material-ui/svg-icons';
import CustomTimeRangeSelector from './CustomTimeRangeSelector';


export default class GranularityModeSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            granularityMode: this.getSelectedGranularityLevel(),
            granularityModeValue: 'none',
            open: false
        };

        this.generateTabs = this.generateTabs.bind(this);
        this.switchGranularity = this.switchGranularity.bind(this);
        this.onGranularityModeChange = this.onGranularityModeChange.bind(this);
        this.getHighGranularityOptions = this.getHighGranularityOptions.bind(this);
        this.getLowGranularityOptions = this.getLowGranularityOptions.bind(this);
        this.generateGranularityModeSwitchButton = this.generateGranularityModeSwitchButton.bind(this);
        this.generateLeftArrow = this.generateLeftArrow.bind(this);
        this.generateRightArrow = this.generateRightArrow.bind(this);
        this.generateRightArrow = this.generateRightArrow.bind(this);
        this.getCustomSelectButton = this.getCustomSelectButton.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
        this.getSelectedTimeRange = this.getSelectedTimeRange.bind(this);
        this.getSelectedGranularityLevel = this.getSelectedGranularityLevel.bind(this);
    }

    render() {
        let {granularityMode} = this.state;

        return (
            <div>
                <div>
                    <span
                        style={{marginRight: 10}}>
                        Last :
                    </span>
                    {this.generateTabs(granularityMode)}
                    {this.generateGranularityModeSwitchButton(granularityMode)}
                    {this.getCustomSelectButton()}
                </div>
            </div>
        );
    }

    switchGranularity() {
        this.setState({granularityMode: this.state.granularityMode === 'low' ? 'high' : 'low'});
    }

    generateTabs(granularityMode) {
        let selectedTimeRange = this.getSelectedTimeRange();
        let options = granularityMode === 'high' ? this.getHighGranularityOptions() : this.getLowGranularityOptions();
        return options.map((option) =>
            selectedTimeRange === option ?
                <FlatButton
                    onClick={() => this.onGranularityModeChange(option)}
                    label={option}
                    style={{backgroundColor: '#383838'}}/> :
                <FlatButton
                    onClick={() => this.onGranularityModeChange(option)}
                    label={option}/>
        );
    }

    onGranularityModeChange(value) {
        let {onChange} = this.props;
        this.setState({granularityModeValue: value});
        return onChange && onChange(value);
    }

    generateGranularityModeSwitchButton(granularityMode) {
        return granularityMode === 'low' ? this.generateRightArrow() : this.generateLeftArrow();
    }

    generateRightArrow() {
        if (this.getHighGranularityOptions().length > 0) {
            return (
                <IconButton
                    style={{
                        marginRight: 5,
                        verticalAlign: 'middle'
                    }}
                    onClick={this.switchGranularity}>
                    <HardwareKeyboardArrowRight/>
                </IconButton>);
        }
    }

    generateLeftArrow() {
        if (this.getLowGranularityOptions().length > 0) {
            return (
                <IconButton
                    style={{
                        marginRight: 5,
                        verticalAlign: 'middle'
                    }}
                    onClick={this.switchGranularity}>
                    <HardwareKeyboardArrowLeft/>
                </IconButton>);
        }
    }

    getLowGranularityOptions() {
        let minGranularity = this.props.options.availableGranularities;
        let granularityOptions = [];

        switch (minGranularity) {
            case 'From Second':
            case 'From Minute':
                granularityOptions = ['1 Min', '15 Min', '1 Hour', '1 Day'];
                break;
            case 'From Hour':
                granularityOptions = ['1 Hour', '1 Day'];
                break;
        }
        return granularityOptions;
    }


    getHighGranularityOptions() {
        let minGranularity = this.props.options.availableGranularities;
        let granularityOptions = [];

        switch (minGranularity) {
            case 'From Second':
                granularityOptions = ['1 Day', '7 Days', '1 Month', '3 Months', '6 Months', '1 Year'];
                break;
            case 'From Minute':
            case 'From Hour':
            case 'From Day':
                granularityOptions = ['1 Day', '7 Days', '1 Month', '3 Months', '6 Months', '1 Year'];
                break;
            case 'From Month':
                granularityOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];
                break;
            case 'From Year':
                granularityOptions = ['1 Year'];
                break;
        }
        return granularityOptions;
    }

    getCustomSelectButton() {
        let selectedTimeRange = '';
        if (location.search.length > 1) {
            selectedTimeRange = JSON.parse(decodeURI(location.search.substr(1))).tr;
        }
        let customButton = selectedTimeRange === 'custom' ?
            <FlatButton
                onClick={this.handleClick}
                label='Custom'
                style={{backgroundColor: '#383838'}}/> :
            <FlatButton
                onClick={this.handleClick}
                label='Custom'/>;
        return (
            <div
                style={{display: 'inline'}}>
                {customButton}
                <Popover
                    open={this.state.open}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={{
                        horizontal: 'left',
                        vertical: 'bottom'
                    }}
                    targetOrigin={{
                        horizontal: 'left',
                        vertical: 'top'
                    }}
                    onRequestClose={this.handleRequestClose}
                    style={{width: '40%'}}>
                    <Menu>
                        <div
                            style={{
                                margin: 20,
                                paddingBottom: 20
                            }}>
                            <CustomTimeRangeSelector
                                options={this.props.options}
                                handleClose={this.handleRequestClose}
                                onChangeCustom={this.props.onChangeCustom}/>
                        </div>
                    </Menu>
                </Popover>
            </div>
        );
    }

    handleClick(event) {
        event.preventDefault();

        this.setState({
            open: true,
            anchorEl: event.currentTarget,
        });
        this.onGranularityModeChange('custom');
    }

    handleRequestClose() {
        this.setState({
            open: false,
        });
    };

    getSelectedTimeRange() {
        let selectedTimeRange = '';
        if (location.search.length > 1) {
            selectedTimeRange = this.props.getTimeRangeName(JSON.parse(decodeURI(location.search.substr(1))).tr);
        }
        return selectedTimeRange;
    }

    getSelectedGranularityLevel() {
        let selectedTimeRange = this.getSelectedTimeRange();
        if (this.getHighGranularityOptions().indexOf(selectedTimeRange) > -1) {
            return 'high';
        } else if (this.getLowGranularityOptions().indexOf(selectedTimeRange) > -1) {
            return 'low';
        } else if (this.getHighGranularityOptions().indexOf(this.props.options.defaultValue) > -1) {
            return 'high';
        } else if (this.getLowGranularityOptions().indexOf(this.props.options.defaultValue) > -1) {
            return 'low';
        } else {
            return '';
        }
    }

}
