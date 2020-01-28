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
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Tooltip from '@material-ui/core/Tooltip';


const styles = {
    headingWrapper: {
        margin: 'auto',
        width: '95%',
    },
    formControl: {
        marginTop: '2%',
        minWidth: 120,
    },
};

/**
 * React Component for month year select
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render month year select
 */
export default function DateWidget(props) {
    /**
     * Render Years
     * @returns {[React.node]}
     */
    function renderYears() {
        const years = [];
        const currentYear = new Date().getFullYear()
        for (let step = currentYear - 9 ; step <= currentYear; step++) {
            years.push(<MenuItem value={step}>{step}</MenuItem>);
        }
        return years;
    }
    const {
        year, month, setYear, setMonth,
    } = props;
    return (
        <React.Fragment>
            <FormControl style={styles.formControl}>
                <Tooltip
                    placement='top'
                    title={<FormattedMessage id='year' defaultMessage='Year :' />}
                >
                    <InputLabel
                        shrink
                        htmlFor='year-number'
                        style={styles.formLabel}
                    >
                        <FormattedMessage id='year' defaultMessage='Year :' />
                    </InputLabel>
                </Tooltip>
                <Select
                    id='year-number'
                    value={year}
                    onChange={(event) => {
                        const { value } = event.target;
                        setYear(value);
                    }}
                    type='number'
                    margin='normal'
                >
                    {renderYears()}
                </Select>
            </FormControl>
            <FormControl style={{ ...styles.formControl, marginLeft: 20 }}>
                <Tooltip
                    placement='top'
                    title={<FormattedMessage id='month' defaultMessage='Month :' />}
                >
                    <InputLabel
                        shrink
                        htmlFor='month-number'
                        style={styles.formLabel}
                    >
                        <FormattedMessage id='month' defaultMessage='Month :' />
                    </InputLabel>
                </Tooltip>
                <Select
                    id='month-number'
                    value={month}
                    onChange={(event) => {
                        const { value } = event.target;
                        setMonth(value);
                    }}
                    type='number'
                    margin='normal'
                >
                    <MenuItem value={0}>January</MenuItem>
                    <MenuItem value={1}>February</MenuItem>
                    <MenuItem value={2}>March</MenuItem>
                    <MenuItem value={3}>April</MenuItem>
                    <MenuItem value={4}>May</MenuItem>
                    <MenuItem value={5}>June</MenuItem>
                    <MenuItem value={6}>July</MenuItem>
                    <MenuItem value={7}>August</MenuItem>
                    <MenuItem value={8}>September</MenuItem>
                    <MenuItem value={9}>October</MenuItem>
                    <MenuItem value={10}>November</MenuItem>
                    <MenuItem value={11}>December</MenuItem>
                </Select>
            </FormControl>

        </React.Fragment>
    );
}

DateWidget.propTypes = {
    year: PropTypes.number.isRequired,
    month: PropTypes.number.isRequired,
    setYear: PropTypes.func.isRequired,
    setMonth: PropTypes.func.isRequired,
};
