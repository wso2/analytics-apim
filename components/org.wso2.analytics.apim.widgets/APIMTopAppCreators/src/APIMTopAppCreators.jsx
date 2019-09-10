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
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { VictoryPie, VictoryLegend, VictoryTooltip } from 'victory';
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
 * React Component for Top App Creators widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Top App Creators widget body
 */
export default function APIMTopAppCreators(props) {
    const {
        themeName, height, limit, creatorData, legendData, handleChange,
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
            height: '15%',
            margin: 'auto',
        },
        form: {
            width: '30%',
            marginLeft: '5%',
            marginTop: '5%',
            display: 'flex',
            flexWrap: 'wrap',
        },
        textField: {
            marginLeft: 8,
            marginRight: 8,
            width: 200,
        },
    };
    if (creatorData.length === 0) {
        return (
            <div style={styles.paperWrapper}>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography variant='h5' component='h3'>
                        <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    }
    return (
        <MuiThemeProvider
            theme={themeName === 'dark' ? darkTheme : lightTheme}
        >
            <Scrollbars
                style={{ height }}
            >
                <div style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    width: '80%',
                    margin: '5% auto',
                    padding: '10% 5%',
                }}
                >
                    <div style={styles.headingWrapper}>
                        <h3 style={{
                            borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                            paddingBottom: '10px',
                            margin: 'auto',
                            textAlign: 'left',
                            fontWeight: 'normal',
                            letterSpacing: 1.5,
                        }}
                        >
                            <FormattedMessage id='widget.heading' defaultMessage='TOP APP CREATORS' />
                        </h3>
                    </div>
                    <div style={styles.formWrapper}>
                        <form style={styles.form} noValidate autoComplete='off'>
                            <TextField
                                id='limit-number'
                                label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                                value={limit}
                                onChange={handleChange}
                                type='number'
                                style={styles.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                margin='normal'
                            />
                        </form>
                    </div>
                    <div>
                        <svg viewBox='0 0 700 500'>
                            <VictoryPie
                                labelComponent={(
                                    <VictoryTooltip
                                        orientation='right'
                                        pointerLength={0}
                                        cornerRadius={2}
                                        flyoutStyle={{
                                            fill: '#000',
                                            fillOpacity: '0.5',
                                            strokeWidth: 1,
                                        }}
                                        style={{ fill: '#fff', fontSize: 25 }}
                                    />
                                )}
                                width={500}
                                height={500}
                                standalone={false}
                                padding={{
                                    left: 50, bottom: 50, top: 50, right: 50,
                                }}
                                colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                                data={creatorData}
                                x={d => d.creator}
                                y={d => d.appcount}
                                labels={d => `${d.creator} : ${((d.appcount
                                    / (sumBy(creatorData, o => o.appcount))) * 100).toFixed(2)}%`}
                            />
                            <VictoryLegend
                                standalone={false}
                                colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                                x={500}
                                y={20}
                                gutter={20}
                                rowGutter={{ top: 0, bottom: -10 }}
                                style={{
                                    labels: {
                                        fill: '#9e9e9e',
                                        fontSize: 25,
                                    },
                                }}
                                data={legendData}
                            />
                        </svg>
                        <CustomTable
                            data={creatorData}
                        />
                    </div>
                </div>
            </Scrollbars>
        </MuiThemeProvider>
    );
}

APIMTopAppCreators.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    limit: PropTypes.string.isRequired,
    creatorData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    handleChange: PropTypes.func.isRequired,
};
