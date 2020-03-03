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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import sumBy from 'lodash/sumBy';
import {
    VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme,
} from 'victory';
import { colorScale } from '@analytics-apim/common-lib';
import CustomTable from './CustomTable';

/**
 * React Component for Registered App Users widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Registered App Users widget body
 */
export default function APIMRegisteredAppUsers(props) {
    const {
        themeName, height, width, usageData, legendData, inProgress,
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
        contentDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            margin: '10px',
            padding: '20px',
        },
        statDiv: {
            display: 'flex',
            flexWrap: 'wrap',
            paddingTop: 30,
        },
        pieDiv: {
            width: width > 1000 ? '50%' : '100%',
        },
        tableDiv: {
            width: width > 1000 ? '50%' : '100%',
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
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
        victoryToolTip: {
            fill: '#fff',
            fontSize: 25,
        },
        rowGutter: {
            top: 0,
            bottom: -10,
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

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div style={styles.contentDiv}>
                <div style={styles.headingWrapper}>
                    <h3 style={styles.h3}>
                        <FormattedMessage id='widget.heading' defaultMessage='REGISTERED APPLICATION USERS' />
                    </h3>
                </div>
                { inProgress ? (
                    <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        {usageData.length > 0 ? (
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
                                            data={usageData}
                                            x={d => d.applicationName}
                                            y={d => d.users}
                                            labels={d => `${d.applicationName} : ${((d.users
                                                / (sumBy(usageData, o => o.users))) * 100).toFixed(2)}%`}
                                        />
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
                        )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMRegisteredAppUsers.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
};
