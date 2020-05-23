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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {
    VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme,
} from 'victory';
import { colorScale, Utils } from '@analytics-apim/common-lib';
import sumBy from 'lodash/sumBy';
import CustomTable from './CustomTable';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * React Component for Top Throttled Out Apis widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Top Throttled Out Apis widget body
 */
export default function APIMTopThrottledApis(props) {
    const {
        themeName, height, limit, throttledData, handleChange, inProgress, width, handleOnClickAPI,
    } = props;
    const fontSize = width < 1000 ? 16 : 18;
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
        statDiv: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        pieDiv: {
            width: width > 1000 ? '50%' : '100%',
        },
        tableDiv: {
            width: width > 1000 ? '50%' : '100%',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: '5%',
            minWidth: 120,
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
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
    };
    const columns = [
        {
            id: 'apiname', numeric: false, disablePadding: false, label: 'table.heading.apiname',
        },
        {
            id: 'apiVersion', numeric: true, disablePadding: false, label: 'table.heading.apiVersion',
        },
        {
            id: 'throttledcount', numeric: true, disablePadding: false, label: 'table.heading.throttledcount',
        },
    ];
    const { pieChartData, legendData } = Utils.summarizePieData(throttledData, 'apiname', 'throttledcount');

    return (
        <MuiThemeProvider
            theme={themeName === 'dark' ? darkTheme : lightTheme}
        >
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
                        <h3 style={styles.heading}>
                            <FormattedMessage id='widget.heading' defaultMessage='TOP THROTTLED OUT APIS' />
                        </h3>
                    </div>
                    <div style={styles.formWrapper}>
                        <form style={styles.form} noValidate autoComplete='off'>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit' />}
                                value={limit}
                                onChange={handleChange}
                                type='number'
                                style={styles.formControl}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin='normal'
                            />
                        </form>
                    </div>
                    <div>
                        { inProgress ? (
                            <div style={styles.loading}>
                                <CircularProgress style={styles.loadingIcon} />
                            </div>
                        ) : (
                            <div>
                                { !throttledData || throttledData.length === 0 ? (
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
                                                    innerRadius={130}
                                                    padding={50}
                                                    theme={VictoryTheme.material}
                                                    colorScale={colorScale}
                                                    data={pieChartData}
                                                    x={d => d.apiname}
                                                    y={d => d.throttledcount}
                                                    labels={d => `${d.apiname} : ${((d.throttledcount
                                                        / (sumBy(pieChartData, o => o.throttledcount))) * 100)
                                                        .toFixed(2)}%`}
                                                    events={[
                                                        {
                                                            target: 'data',
                                                            eventHandlers: {
                                                                onClick: () => {
                                                                    return [{
                                                                        mutation: (val) => {
                                                                            handleOnClickAPI(val.datum);
                                                                        },
                                                                    }];
                                                                },
                                                            },
                                                        },
                                                    ]}
                                                />
                                            </svg>
                                        </div>
                                        <div style={styles.tableDiv}>
                                            <CustomTable
                                                data={throttledData}
                                                columns={columns}
                                                onClickTableRow={e => handleOnClickAPI(e)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Scrollbars>
        </MuiThemeProvider>
    );
}

APIMTopThrottledApis.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    limit: PropTypes.string.isRequired,
    throttledData: PropTypes.instanceOf(Object).isRequired,
    handleChange: PropTypes.func.isRequired,
    handleOnClickAPI: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
