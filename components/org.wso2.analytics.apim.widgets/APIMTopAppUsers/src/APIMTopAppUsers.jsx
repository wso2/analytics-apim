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
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import sumBy from 'lodash/sumBy';
import {
    VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme,
} from 'victory';
import { colorScale, Utils } from '@analytics-apim/common-lib';
import CustomTable from './CustomTable';
import IntegrationReactSelect from '../../AppAndAPIErrorsByTime/src/IntegrationReactSelect';

/**
 * Display Top Application Users stats
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Top App Users  widget body
 */
function APIMTopAppUsers(props) {
    const {
        themeName, height, width, limit, applicationSelected, usageData, applicationList,
        applicationSelectedHandleChange, handleLimitChange, inProgress, intl, username,
        timeTo, timeFrom,
    } = props;
    const fontSize = width < 1000 ? 25 : 18;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
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
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginTop: '5%',
            marginLeft: '5%',
        },
        autoSelectForm: {
            marginTop: '5%',
            minWidth: 200,
        },
        selectWrapper: {
            marginTop: '5%',
        },
        textField: {
            marginTop: '5%',
            marginLeft: '5%',
            minWidth: 120,
        },
        select: {
            minWidth: width * 0.3 < 200 ? 150 : 200,
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
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
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        rowGutter: {
            top: 0,
            bottom: -10,
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
        victoryTooltip: {
            fill: '#fff',
            fontSize,
        },
        victoryLegend: {
            labels: {
                fill: '#9e9e9e',
                fontSize,
            },
        },
        flyoutStyle: {
            fill: '#000',
            fillOpacity: '0.5',
            strokeWidth: 1,
        },
    };
    const columns = [
        {
            id: 'username', numeric: false, disablePadding: false, label: 'table.heading.username',
        },
        {
            id: 'hits', numeric: true, disablePadding: false, label: 'table.heading.hits',
        },
    ];
    const strColumns = columns.map((colObj) => {
        return intl.formatMessage({ id: colObj.label });
    });
    const title = intl.formatMessage({ id: 'widget.heading' });
    const { pieChartData, legendData } = Utils.summarizePieData(usageData, 'username', 'hits');

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div style={{
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                margin: '10px',
                padding: '20px',
            }}
            >
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='TOP APPLICATION USERS' />
                    </h3>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form} noValidate autoComplete='off'>
                        <FormControl style={styles.autoSelectForm}>
                            <Tooltip
                                placement='top'
                                title={(
                                    <FormattedMessage
                                        id='applicationName.label'
                                        defaultMessage='Application Name'
                                    />
                                )}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='applicationSelected-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='applicationName.label' defaultMessage='Application Name' />
                                </InputLabel>
                            </Tooltip>
                            <div style={styles.selectWrapper}>
                                <IntegrationReactSelect
                                    options={applicationList}
                                    value={applicationSelected}
                                    onChange={applicationSelectedHandleChange}
                                    placeholder='Select Application'
                                    getLabel={item => item.appName}
                                    getValue={item => item.appId}
                                />
                            </div>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='limit-number'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='limit' defaultMessage='Limit :' />
                                </InputLabel>
                            </Tooltip>
                            <Input
                                id='limit-number'
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                {inProgress ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        {usageData.length > 0 ? (
                            <div style={styles.statDiv}>
                                <div style={styles.pieDiv}>
                                    <svg viewBox='-50 0 1000 500'>
                                        <VictoryLegend
                                            standalone={false}
                                            theme={VictoryTheme.material}
                                            colorScale={colorScale}
                                            x={460}
                                            y={20}
                                            gutter={20}
                                            rowGutter={styles.rowGutter}
                                            style={styles.victoryLegend}
                                            data={legendData}
                                        />
                                        <VictoryPie
                                            labelComponent={(
                                                <VictoryTooltip
                                                    orientation='right'
                                                    pointerLength={0}
                                                    cornerRadius={2}
                                                    flyoutStyle={styles.flyoutStyle}
                                                    style={styles.victoryTooltip}
                                                    theme={VictoryTheme.material}
                                                />
                                            )}
                                            width={500}
                                            height={500}
                                            standalone={false}
                                            padding={50}
                                            innerRadius={130}
                                            theme={VictoryTheme.material}
                                            colorScale={colorScale}
                                            data={pieChartData}
                                            x={d => d.username}
                                            y={d => d.hits}
                                            labels={d => `${d.username} : ${((d.hits
                                                / (sumBy(pieChartData, o => o.hits))) * 100).toFixed(2)}%`}
                                        />
                                    </svg>
                                </div>
                                <div style={styles.tableDiv}>
                                    <CustomTable
                                        data={usageData}
                                        inProgress={inProgress}
                                        columns={columns}
                                        strColumns={strColumns}
                                        title={title}
                                        username={username}
                                        timeTo={timeTo}
                                        timeFrom={timeFrom}
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

APIMTopAppUsers.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    limit: PropTypes.string.isRequired,
    applicationSelected: PropTypes.number.isRequired,
    applicationList: PropTypes.instanceOf(Object).isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    applicationSelectedHandleChange: PropTypes.func.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    username: PropTypes.string.isRequired,
};

export default injectIntl(APIMTopAppUsers);
