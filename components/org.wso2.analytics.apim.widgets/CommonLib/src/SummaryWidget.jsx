// This is not a component so prop validation isnt applicable.
/* eslint-disable react/prop-types */

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

import { green, red } from '@material-ui/core/colors';

import { withStyles } from '@material-ui/core/styles';
import shortNumber from 'short-number';
import Tooltip from '@material-ui/core/Tooltip';

const styles = () => ({

});

/**
 * Create React Component for Custom Table Toolbar.
 * @param {Object} props - Widget options
 * @returns {ReactNode}
 */
function SummaryWidget(props) {
    const {
        themeName,
        lastWeekCount,
        thisWeekCount,
        negative,
        tooltip,
    } = props;
    let diff = thisWeekCount - lastWeekCount;
    if (negative) {
        diff *= -1;
    }
    const diffColor = diff < 0 ? red[500] : green[500];
    let arrow = thisWeekCount > lastWeekCount ? '▲' : '▼';
    if (diff === 0) {
        arrow = '';
    }
    return (
        <div
            style={{
                margin: 'auto',
                textAlign: 'center',
                fontSize: '450%',
                fontWeight: 500,
                color: themeName === 'dark' ? '#fff' : '#2571a7',
            }}
        >
            <span>{shortNumber(thisWeekCount)}</span>

            <Tooltip title={tooltip}>
                <span style={{ fontSize: 20, color: diffColor }}>
                    {arrow}
                    {shortNumber(Math.abs(diff))}
                </span>
            </Tooltip>

        </div>
    );
}

SummaryWidget.propTypes = {
};

export default withStyles(styles)(SummaryWidget);
