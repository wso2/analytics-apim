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
import Moment from 'moment';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';

/**
 * React Component for APIM Overall Avg Latency widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Avg Latency widget body
 */
export default function APIMOverallAvgLatency(props) {
    const {
        themeName, avglatency, timeFrom, timeTo,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            paddingTop: '15px',
            width: '90%',
        },
        iconWrapper: {
            float: 'left',
            width: '40%',
            height: '62%',
        },
        dataWrapper: {
            float: 'left',
            width: '60%',
            height: '50%',
            paddingTop: '8%',
        },
        latencydata: {
            margin: 0,
            marginTop: '5%',
            color: 'rgb(135,205,223)',
            letterSpacing: 1,
            fontSize: '80%',
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
        h1: {
            margin: 'auto',
            textAlign: 'center',
            fontSize: '300%',
            display: 'inline',
            color: themeName === 'dark' ? '#fff' : '#2571a7',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #2571a7',
            paddingBottom: '10px',
            margin: 'auto',
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        icon: {
            display: 'block',
            margin: 'auto',
            marginTop: '25%',
            width: '50%',
            height: '50%',
            color: themeName === 'dark' ? '#fff' : '#e01171',
        },
    };

    return (
        <div
            style={{
                width: '90%',
                height: '85%',
                margin: '5% 5%',
                background: themeName === 'dark' ? 'linear-gradient(to right, rgba(7, 4, 51, 1) 0%,'
                        + ' rgb(188, 39, 142) 46%, rgb(101, 42, 80) 100%)' : '#fff',
                fontFamily: "'Open Sans', sans-serif",
            }}
        >
            <div style={styles.headingWrapper}>
                <h3 style={styles.h3}>
                    <FormattedMessage id='widget.heading' defaultMessage='OVERALL AVERAGE LATENCY' />
                </h3>
            </div>
            <div style={styles.iconWrapper}>
                <CompareArrowsIcon
                    style={styles.icon}
                />
            </div>
            <div style={styles.dataWrapper}>
                <h1 style={styles.h1}>
                    {avglatency}
                </h1>
                <h3 style={styles.typeText}>
                    <FormattedMessage id='latency' defaultMessage='MS' />
                </h3>
                <p style={styles.latencydata}>
                    [
                    {' '}
                    {avglatency}
                    {' '}
                    {<FormattedMessage id='latency' defaultMessage='MS' />}
                    {' '}
                    {<FormattedMessage id='within.text' defaultMessage='WITHIN' />}
                    {' '}
                    {Moment(timeFrom).format('YYYY-MMM')}
                    {' '}
                    {<FormattedMessage id='to' defaultMessage='TO' />}
                    {' '}
                    {Moment(timeTo).format('YYYY-MMM')}
                    {' '}
                    ]
                </p>
            </div>
        </div>
    );
}

APIMOverallAvgLatency.propTypes = {
    themeName: PropTypes.string.isRequired,
    avglatency: PropTypes.number.isRequired,
    timeFrom: PropTypes.number.isRequired,
    timeTo: PropTypes.number.isRequired,
};
