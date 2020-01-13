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
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import APIMAppCreatedData from './APIMAppCreatedData';

/**
 * React Component for APIM App Created Analytics widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM App Created Analytics widget body
 */
export default function APIMAppCreatedAnalytics(props) {
    const {
        themeName, height, apiCreatedBy, appCreatedBy, subscribedTo, apilist, sublist, chartData, tableData,
        xAxisTicks, maxCount, apiCreatedHandleChange, appCreatedHandleChange, subscribedToHandleChange, inProgress,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: '5%',
            minWidth: 120,
        },
        selectEmpty: {
            marginTop: 10,
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        loading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };
    const createdDataProps = {
        themeName, chartData, tableData, xAxisTicks, maxCount,
    };
    return (
        <Scrollbars style={{ height }}>
            <div
                style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    height,
                    margin: '10px',
                    padding: '20px',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        margin: 'auto',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='APPS CREATED OVER TIME' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form} noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='api.createdBy.label' defaultMessage='API Created By' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='api-createdBy-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='api.createdBy.label' defaultMessage='API Created By' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={apiCreatedBy}
                                onChange={apiCreatedHandleChange}
                                input={<Input name='api-createdBy' id='api-createdBy-label-placeholder' />}
                                displayEmpty
                                name='apiCreatedBy'
                                style={styles.selectEmpty}
                            >
                                <MenuItem value='All'>
                                    <FormattedMessage id='all.menuItem' defaultMessage='All' />
                                </MenuItem>
                                <MenuItem value='Me'>
                                    <FormattedMessage id='me.menuItem' defaultMessage='Me' />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={(
                                    <FormattedMessage
                                        id='app.createdBy.label'
                                        defaultMessage='APP Created By'
                                    />
                                )}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='app-createdBy-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='app.createdBy.label' defaultMessage='APP Created By' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={appCreatedBy}
                                onChange={appCreatedHandleChange}
                                input={<Input name='app-createdBy' id='app-createdBy-label-placeholder' />}
                                displayEmpty
                                name='appCreatedBy'
                                style={styles.selectEmpty}
                            >
                                {
                                    sublist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={(
                                    <FormattedMessage
                                        id='subscribedTo.label'
                                        defaultMessage='Subscribed To'
                                    />
                                )}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='subscribedTo-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='subscribedTo.label' defaultMessage='Subscribed To' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={subscribedTo}
                                onChange={subscribedToHandleChange}
                                input={<Input name='subscribedTo' id='subscribedTo-label-placeholder' />}
                                displayEmpty
                                name='subscribedTo'
                                style={styles.selectEmpty}
                            >
                                {
                                    apilist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </form>
                </div>
                { inProgress
                    ? (
                        <div style={styles.loading}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    )
                    : <APIMAppCreatedData {...createdDataProps} />
                }
            </div>
        </Scrollbars>
    );
}

APIMAppCreatedAnalytics.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    apiCreatedBy: PropTypes.string.isRequired,
    appCreatedBy: PropTypes.string.isRequired,
    subscribedTo: PropTypes.string.isRequired,
    apilist: PropTypes.instanceOf(Object).isRequired,
    sublist: PropTypes.instanceOf(Object).isRequired,
    chartData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
    maxCount: PropTypes.number.isRequired,
    apiCreatedHandleChange: PropTypes.func.isRequired,
    appCreatedHandleChange: PropTypes.func.isRequired,
    subscribedToHandleChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
