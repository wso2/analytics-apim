/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import { Scrollbars } from 'react-custom-scrollbars';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import APIMApiCreatedData from './APIMApiCreatedData';

/**
 * React Component for APIM Api Created Analytics widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Created Analytics widget body
 */
export default function APIMApiCreatedAnalytics(props) {
    const {
        themeName, height, createdBy, chartData, tableData, xAxisTicks, maxCount, handleChange,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '97%',
        },
        formWrapper: {
            width: '97%',
            height: '10%',
            margin: 'auto',
            marginTop: '2%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            margin: 5,
            minWidth: 120,
        },
        selectEmpty: {
            marginTop: 10,
        },
    };
    const createdDataProps = {
        themeName, chartData, tableData, xAxisTicks, maxCount,
    };
    return (
        <Scrollbars
            style={{ height }}
        >
            <div
                style={{
                    background: themeName === 'dark' ? '#0e1e33' : '#fff',
                    width: '85%',
                    padding: '5% 5%',
                    margin: '1.5% auto',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        width: '40%',
                        paddingBottom: '15px',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='APIS CREATED OVER TIME' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form} noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='createdBy-label-placeholder'>
                                <FormattedMessage id='createdBy.label' defaultMessage='Created By' />
                            </InputLabel>
                            <Select
                                value={createdBy}
                                onChange={handleChange}
                                input={<Input name='createdBy' id='createdBy-label-placeholder' />}
                                displayEmpty
                                name='createdBy'
                                style={styles.selectEmpty}
                            >
                                <MenuItem value='all'>
                                    <FormattedMessage id='all.menuItem' defaultMessage='All' />
                                </MenuItem>
                                <MenuItem value='me'>
                                    <FormattedMessage id='me.menuItem' defaultMessage='Me' />
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </form>
                </div>
                <APIMApiCreatedData {...createdDataProps} />
            </div>
        </Scrollbars>
    );
}

APIMApiCreatedAnalytics.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    createdBy: PropTypes.string.isRequired,
    chartData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
    maxCount: PropTypes.number.isRequired,
    handleChange: PropTypes.func.isRequired,
};
