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
import sumBy from 'lodash/sumBy';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {
    VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme,
} from 'victory';
import { colorScale, Utils } from '@analytics-apim/common-lib';


/**
 * React Component for Top Platforms widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Top Platforms widget body
 */
export default function APIMTopPlatforms(props) {
    const {
        themeName, height, limit, platformData, handleLimitChange, inProgress,
    } = props;
    const fontSize = 16;
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
            paddingBottom: 20,
        },
        formControl: {
            marginLeft: 10,
            marginTop: 10,
            width: '10%',
        },
        dataWrapper: {
            height: '80%',
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

    const { pieChartData, legendData } = Utils.summarizePieData(platformData, 'platform', 'reqCount');

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
                    <h3 style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='TOP PLATFORMS' />
                    </h3>
                </div>
                <div style={styles.formWrapper}>
                    <form>
                        <TextField
                            id='limit-number'
                            label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                            value={limit}
                            onChange={handleLimitChange}
                            type='number'
                            style={styles.formControl}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin='normal'
                        />
                    </form>
                </div>
                { inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        { !platformData || platformData.length === 0 ? (
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
                                <svg viewBox='-100 -20 1000 800'>
                                    <VictoryLegend
                                        standalone={false}
                                        theme={VictoryTheme.material}
                                        colorScale={colorScale}
                                        x={500}
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
                                        x={d => d.platform}
                                        y={d => d.reqCount}
                                        labels={d => `${d.platform} : ${((d.reqCount
                                            / (sumBy(pieChartData, o => o.reqCount))) * 100).toFixed(2)}%`}
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMTopPlatforms.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    limit: PropTypes.string.isRequired,
    platformData: PropTypes.instanceOf(Object).isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
};
