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
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';

/**
 * React Component for APIM Developer Signups widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Developer Signups widget body
 */
export default function APIMDeveloperSignups(props) {
    const { themeName, totalCount, weekCount } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            paddingTop: '15px',
            width: '90%',
        },
        cIconWrapper: {
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
        weekCount: {
            margin: 0,
            marginTop: '5%',
            color: 'rgb(236, 195, 216)',
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
        icon: {
            position: 'absolute',
            bottom: '13%',
            right: '8%',
        },
    };
    return (
        <div style={{
            width: '90%',
            height: '85%',
            margin: '5% 5%',
            background: themeName === 'dark' ? 'linear-gradient(to right, rgba(7, 4, 51, 1) 0%,'
                + ' rgb(188, 39, 142) 46%, rgb(101, 42, 80) 100%)' : '#fff',
            fontFamily: "'Open Sans', sans-serif",
        }}
        >
            <div style={styles.headingWrapper}>
                <h3 style={{
                    borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #e01171',
                    paddingBottom: '10px',
                    margin: 'auto',
                    marginTop: 0,
                    textAlign: 'left',
                    fontWeight: 'normal',
                    letterSpacing: 1.5,
                }}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='TOTAL SIGNUPS' />
                </h3>
            </div>
            <div style={styles.cIconWrapper}>
                <SupervisorAccount style={{
                    display: 'block',
                    margin: 'auto',
                    marginTop: '25%',
                    width: '50%',
                    height: '50%',
                    color: themeName === 'dark' ? '#fff' : '#e01171',
                }}
                />
            </div>
            <div style={styles.dataWrapper}>
                <h1
                    style={{
                        margin: 'auto',
                        textAlign: 'center',
                        fontSize: '300%',
                        display: 'inline',
                        color: themeName === 'dark' ? '#fff' : '#e01171',
                    }}
                >
                    {totalCount}
                </h1>
                <h3 style={styles.typeText}>{totalCount === '01' ? 'SIGNUP' : 'SIGNUPS'}</h3>
                <p style={styles.weekCount}>
                    [
                    {' '}
                    {weekCount}
                    {' '}
                    {weekCount === '01' ? 'SIGNUP' : 'SIGNUPS'}
                    {' '}
                    <FormattedMessage id='within.week.text' defaultMessage='WITHIN LAST WEEK ' />
                    ]
                </p>
            </div>
            <button
                type='button'
                style={{
                    display: 'block',
                    width: '100%',
                    height: '21%',
                    background: themeName === 'dark'
                        ? 'linear-gradient(to right, rgba(37, 38, 41, 0.75) 0%, rgba(252, 252, 252, 0) 100%)'
                        : '#fff',
                    border: 'none',
                    borderTop: themeName === 'dark' ? 'none' : '1.5px solid #000',
                    color: themeName === 'dark' ? '#fff' : '#000',
                    textAlign: 'left',
                    padding: '0 5%',
                    fontSize: '90%',
                    letterSpacing: 1,
                    cursor: 'pointer',
                }}
                onClick={() => {
                    window.location.href = './developer-statistics';
                }}
            >
                <FormattedMessage id='overtime.btn.text' defaultMessage='Overtime Analysis' />
                <PlayCircleFilled style={styles.icon} />
            </button>
        </div>
    );
}

APIMDeveloperSignups.propTypes = {
    themeName: PropTypes.string.isRequired,
    totalCount: PropTypes.string.isRequired,
    weekCount: PropTypes.string.isRequired,
};
