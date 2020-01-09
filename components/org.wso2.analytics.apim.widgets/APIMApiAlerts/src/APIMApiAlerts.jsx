/* eslint-disable react/jsx-indent-props */
/* eslint-disable comma-dangle */
/* eslint-disable indent */
/* eslint-disable react/jsx-indent */
/* eslint-disable spaced-comment */
/* eslint-disable react/jsx-one-expression-per-line */
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
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled';
import { VictoryPie, VictoryLabel } from 'victory';
import { Scrollbars } from 'react-custom-scrollbars';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
/**
 * React Component for APIM Api Created widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Created Count widget body
 */
export default function APIMApiAlerts(props) {

    const { themeName, finaldataset, totalcount } = props;
    const styles = {
        headingWrapper: {
            height: '5%',
            margin: 'auto',
            paddingTop: '10px',
            width: '90%',
        },
        dataWrapper: {
            textAlign: 'center',
            width: 'auto',
            height: 'auto',
        },
        weekCount: {
            margin: 0,
            marginTop: '5%',
            color: 'rgb(135,205,223)',
            letterSpacing: 1,
            fontSize: '80%',
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
        typeText: {
            textAlign: 'left',
            fontWeight: 'normal',
            margin: 0,
            display: 'inline',
            marginLeft: '3%',
            letterSpacing: 1.5,
            fontSize: 'small',
        },
        playIcon: {
            position: 'absolute',
            bottom: '13%',
            right: '8%',
        },
    };
    if (totalcount == null || totalcount == 0) {
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
        <div
            style={{
                background: themeName === 'light' ? '#fff' : '#162638',
                width: 'auto',
                height: 'auto',
                margin: '3% 3%',
            }}
        >
            <div style={styles.headingWrapper}>
                <h3
                    style={{
                        borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '3px solid #2571a7',
                        paddingBottom: '5px',
                        margin: 'auto',
                        textAlign: 'center',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='Recent Api Alerts' />
                </h3>
                <h3
                style={{
                    fontWeight: 'normal'
                }}
                >
                   Total Alerts : {totalcount}
                </h3>
            </div>

            <div style={styles.dataWrapper}>
            <svg viewBox="-150 0 600 300">
                <VictoryPie
                animate={{
                    duration: 2000,
                    onLoad: { duration: 1000 }
                    }}
                standalone={false}
                width={290} height={290}
                data={finaldataset}

                innerRadius={0} labelRadius={0}
                colorScale='blue'
                style={{ labels: { fontSize: 11, fill: "white" } }}
                />
            </svg>
            </div>
        </div> 
        );
}

APIMApiAlerts.propTypes = {
    themeName: PropTypes.string.isRequired,
    sortedarray: PropTypes.string.isRequired,
    totalcount: PropTypes.string.isRequired,
};
