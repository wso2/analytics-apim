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
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VizG from 'react-vizgrammar';
import CustomTable from './CustomTable';

/**
 * React Component for Api Fault Analytics widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Fault Analytics widget body
 */
function ApiFaultAnalytics(props) {
    const {
        themeName, height, width, inProgress, faultData, tableData, intl, username, limit, handleLimitChange,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        dataWrapper: {
            paddingTop: '20px',

        },
        tableWrapper: {
            paddingTop: '20px',

        },
        paperWrapper: {
            height: '75%',
            width: '95%',
            margin: 'auto',
        },
        paper: {
            background: themeName === 'dark' ? '#152638' : '#E8E8E8',
            padding: '4%',
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
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        chartWrapper: {
            width: '95%',
        },
        formWrapper: {
            paddingBottom: 20,
        },
        formControl: {
            marginLeft: 10,
            marginTop: 10,
            width: '10%',
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };
    const chartConfig = {
        x: 'TIME',
        charts: [
            {
                type: 'line',
                y: 'COUNT',
                fill: '#958E94',
            },
        ],
        maxLength: 60,
        width: 800,
        height: 400,
        legend: false,
        disableVerticalGrid: true,
        timeFormat: '%d-%b-%y %H:%M',
        tipTimeFormat: '%Y-%m-%d %H:%M:%S',
        style: {
            xAxisTickAngle: -10,
            tickLabelColor: '#a7b0c8',
            axisLabelColor: '#a7b0c8',
            axisTextSize: 300,
            legendTextColor: '#a7b0c8',
            legendTextSize: 15,
        },
    };
    const metadata = {
        names: ['COUNT', 'TIME'],
        types: ['linear', 'time'],
    };
    const columns = [
        {
            id: 'time', numeric: false, disablePadding: false, label: 'table.heading.time',
        },
        {
            id: 'appName', numeric: false, disablePadding: false, label: 'table.heading.appName',
        },
        {
            id: 'count', numeric: true, disablePadding: false, label: 'table.heading.count',
        },
    ];
    const strColumns = columns.map((colObj) => {
        return intl.formatMessage({ id: colObj.label });
    });
    const title = intl.formatMessage({ id: 'widget.heading' });

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div
                style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    margin: '10px',
                    padding: '20px',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='API ERRORS OVER TIME' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <InputLabel
                                shrink
                                style={styles.formLabel}
                            >
                                <FormattedMessage id='limit' defaultMessage='Limit' />
                            </InputLabel>
                            <Input
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                { inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        { !faultData || faultData.length === 0 ? (
                            <div style={styles.paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={styles.paper}
                                >
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='nodata.error.heading'
                                            defaultMessage='No Data Available !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='nodata.error.body'
                                            defaultMessage='No data available for the selected options.'
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <div style={styles.dataWrapper}>
                                <div style={styles.chartWrapper}>
                                    <VizG
                                        config={chartConfig}
                                        metadata={metadata}
                                        data={faultData}
                                        width={width}
                                    />
                                </div>
                                <div style={styles.tableWrapper}>
                                    <CustomTable
                                        data={tableData}
                                        columns={columns}
                                        strColumns={strColumns}
                                        title={title}
                                        username={username}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

ApiFaultAnalytics.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    faultData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    username: PropTypes.string.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    limit: PropTypes.string.isRequired,
};

export default injectIntl(ApiFaultAnalytics);
