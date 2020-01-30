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
import { FormattedMessage } from 'react-intl';
import CallMissedOutgoingIcon from '@material-ui/icons/CallMissedOutgoing';
import Moment from 'moment';

/**
 * Display Average Response Latency
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Average Response Latency Component
 */
export default function TotalLatencycount(props) {
    const { averageLatency, timeFrom, timeTo } = props;
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
        icon: {
            display: 'block',
            margin: 'auto',
            marginTop: '25%',
            width: '50%',
            height: '50%',
        },
        dataWrapper: {
            float: 'left',
            width: '60%',
            height: '50%',
            paddingTop: '8%',
        },
        weekCount: {
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
        mainWrapper: {
            background: 'linear-gradient(to right, rgba(7, 4, 51, 1) 0%, rgb(188, 39, 142) 46%, rgb(101, 42, 80) 100%)',
            maxWidth: 'auto',
            maxHeight: '200px',
            minWidth: 'auto',
            minHeight: '200px',
            marginRight: '2px',
            marginLeft: '2px',
        },
        h3: {
            borderBottom: '1.5px solid #fff',
            paddingBottom: '10px',
            margin: 'auto',
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        h1: {
            margin: 'auto',
            textAlign: 'center',
            fontSize: '300%',
            display: 'inline',
            color: '#fff',
        },
    };

    return (
        <div
            style={styles.mainWrapper}
        >
            <div style={styles.headingWrapper}>
                <h3 style={styles.h3}>
                    <FormattedMessage
                        id='latencycount.widget.heading'
                        defaultMessage='AVERAGE LATENCY'
                    />
                </h3>
            </div>
            <div style={styles.iconWrapper}>
                <CallMissedOutgoingIcon style={styles.icon} />
            </div>
            <div style={styles.dataWrapper}>
                <h1 style={styles.h1}>
                    {averageLatency}
                </h1>
                <h3 style={styles.typeText}>
                    <FormattedMessage
                        id='latency.Time'
                        defaultMessage='MS'
                    />
                </h3>
                <p style={styles.weekCount}>
                    {' [ '}
                    {averageLatency}
                    {' '}
                    {<FormattedMessage
                        id='latency.Time'
                        defaultMessage='MS'
                    />}
                    {' '}
                    {<FormattedMessage
                        id='within.text'
                        defaultMessage='WITHIN'
                    />}
                    {' '}
                    {Moment(timeFrom).format('YYYY-MMM')}
                    {' '}
                    {<FormattedMessage
                        id='to.text'
                        defaultMessage='TO'
                    />}
                    {' '}
                    {Moment(timeTo).format('YYYY-MMM')}
                    {' ] '}
                </p>
            </div>
        </div>
    );
}

TotalLatencycount.propTypes = {
    averageLatency: PropTypes.number.isRequired,
    timeFrom: PropTypes.number.isRequired,
    timeTo: PropTypes.number.isRequired,
};
