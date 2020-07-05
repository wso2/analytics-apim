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
import {
    VictoryLabel, VictoryTooltip,
} from 'victory';

import PropTypes from 'prop-types';
import {ViewTypeEnum} from "../../AppAndAPIErrorTable/src/Constants";

const classes = {
    flyOut: {
        stroke: 'none',
        fill: 'black',
    },
};

class CustomLabel extends React.Component {
    static defaultEvents = VictoryTooltip.defaultEvents;

    render() {
        const { totalRequestCounts, viewType } = this.props;
        const labelPrefix = viewType === ViewTypeEnum.API ? 'API' : 'App';
        return (
            <g>
                <VictoryTooltip
                    {...this.props}
                    labelComponent={(
                        <VictoryLabel
                            text={
                                e => [labelPrefix + ': ' + e.datum.x,
                                    'Errors: ' + e.datum.y,
                                    'Percentage: ' + ((e.datum.y * 100) / totalRequestCounts).toFixed(2) + '%']}
                        />
                    )}
                    orientation='top'
                    flyoutStyle={classes.flyOut}
                    flyoutHeight={80}
                />
            </g>
        );
    }
}

CustomLabel.propTypes = {
    totalRequestCounts: PropTypes.number.isRequired,
    viewType: PropTypes.string.isRequired,
};

export default CustomLabel;
