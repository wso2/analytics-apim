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
import { Scrollbars } from 'react-custom-scrollbars';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import sumBy from 'lodash/sumBy';
import { VictoryPie, VictoryLegend, VictoryTooltip } from 'victory';
import CustomTable from './CustomTable';

/**
 * Display API usage of application stats
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Application Api Usage  widget body
 */
export default function APIMAppApiUsage(props) {
    const {
        themeName, height, width, limit, applicationSelected, usageData, legendData, applicationList,
        applicationSelectedHandleChange, handleLimitChange, inProgress,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '90%',
        },
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: '#969696',
            width: '75%',
            padding: '4%',
            border: '1.5px solid #fff',
            margin: 'auto',
            marginTop: '5%',
        },
        formWrapper: {
            width: '90%',
            height: '10%',
            margin: 'auto',
        },
        gridWrapper: {
            marginLeft: '5%',
        },
        formControl: {
            marginTop: '5%',
            marginLeft: '5%',
        },
        textField: {
            marginTop: 0,
            minWidth: 120,
            width: '30%',
        },
        select: {
            paddingTop: 5,
            marginTop: 10,
            minWidth: 300,
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        mainDiv: {
            padding: '5% 5%',
        },
        statDiv: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        pieDiv: {
            width: width > 1000 ? '50%' : '100%',
            paddingTop: 30,
        },
        tableDiv: {
            width: width > 1000 ? '50%' : '100%',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
            paddingBottom: '10px',
            margin: 'auto',
            marginTop: 0,
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        flyoutStyle: {
            fill: '#000',
            fillOpacity: '0.5',
            strokeWidth: 1,
        },
        victoryTooltip: {
            fill: '#fff',
            fontSize: 25,
        },
        rowGutter: {
            top: 0,
            bottom: -10,
        },
        victoryLegend: {
            labels: {
                fill: '#9e9e9e',
                fontSize: 25,
            },
        },
    };

    return (
        <Scrollbars style={{ height }}>
            <div style={styles.mainDiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='API USAGE OF APPLICATION' />
                    </h3>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form} noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <InputLabel shrink htmlFor='applicationSelected-label-placeholder'>
                                <FormattedMessage id='applicationName.label' defaultMessage='Application Name' />
                            </InputLabel>
                            <Select
                                value={applicationSelected}
                                onChange={applicationSelectedHandleChange}
                                input={(
                                    <Input
                                        name='applicationSelected'
                                        id='applicationSelected-label-placeholder'
                                    />
                                )}
                                displayEmpty
                                name='applicationSelected'
                                style={styles.select}
                            >
                                { applicationList.length > 0
                                    ? applicationList.map(option => (
                                        <MenuItem key={option.appId} value={option.appId}>
                                            {option.appName}
                                        </MenuItem>
                                    ))
                                    : (
                                        <MenuItem disabled>
                                            <FormattedMessage
                                                id='no.applications'
                                                defaultMessage='No Application Available'
                                            />
                                        </MenuItem>
                                    )
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                style={styles.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                { inProgress ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        { usageData.length > 0 ? (
                            <div style={styles.statDiv}>
                                <div style={styles.pieDiv}>
                                    <svg viewBox='-50 0 1000 500'>
                                        <VictoryPie
                                            labelComponent={(
                                                <VictoryTooltip
                                                    orientation='right'
                                                    pointerLength={0}
                                                    cornerRadius={2}
                                                    flyoutStyle={styles.flyoutStyle}
                                                    style={styles.victoryTooltip}
                                                />
                                            )}
                                            width={500}
                                            height={500}
                                            standalone={false}
                                            padding={50}
                                            colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171',
                                                '#ffe2ff']}
                                            data={usageData}
                                            x={d => d.apiName}
                                            y={d => d.hits}
                                            labels={d => `${d.apiName} : ${((d.hits
                                                / (sumBy(usageData, o => o.hits))) * 100).toFixed(2)}%`}
                                        />
                                        <VictoryLegend
                                            standalone={false}
                                            colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171',
                                                '#ffe2ff']}
                                            x={500}
                                            y={20}
                                            gutter={20}
                                            rowGutter={styles.rowGutter}
                                            style={styles.victoryLegend}
                                            data={legendData}
                                        />
                                    </svg>
                                </div>
                                <div style={styles.tableDiv}>
                                    <CustomTable
                                        data={usageData}
                                        inProgress={inProgress}
                                    />
                                </div>
                            </div>
                        ) : (
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
                        )
                        }
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMAppApiUsage.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    limit: PropTypes.string.isRequired,
    applicationSelected: PropTypes.number.isRequired,
    applicationList: PropTypes.instanceOf(Object).isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    applicationSelectedHandleChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
