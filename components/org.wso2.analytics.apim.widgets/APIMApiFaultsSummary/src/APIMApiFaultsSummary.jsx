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
import { SummaryWidget } from '@analytics-apim/common-lib';
import './styles.css';


/**
 * React Component for APIM Api Usage widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Usage Count widget body
 */
export default function APIMApiFaultsSummary(props) {
    const { themeName, thisWeekCount, lastWeekCount } = props;
    const styles = {
        root: {
            backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
            height: '100%',
            cursor: 'pointer',
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        headingWrapper: {
            margin: 'auto',
            paddingTop: 30,
        },
        dataWrapper: {
            paddingTop: 10,
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
        moreButton: {
            marginTop: 10,
            marginRight: 20,
        },
        subheading: {
            textAlign: 'center',
            margin: 5,
            fontSize: 14,
            color: '#b5b5b5',
        },
    };
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
            style={styles.root}
            className={`overview-wrapper ${themeName}`}
            onClick={() => {
                window.location.href = window.contextPath
                    + '/dashboards/apimpublisher/faults#{"dtrp":{"tr":"7days","g":"day","sync":false},'
                    + '"faultyapis":{"limit":5},"throttledapis":{"limit":5}}';
            }}
        >
            <div style={styles.headingWrapper}>
                <h3
                    style={styles.heading}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='API FAULTS SUMMARY' />
                </h3>
                <p style={styles.subheading}>
                    <FormattedMessage id='widget.subheading' defaultMessage='(Last 7 Days)' />
                </p>
            </div>
            <div style={styles.dataWrapper}>
                <SummaryWidget
                    themeName={themeName}
                    thisWeekCount={thisWeekCount}
                    lastWeekCount={lastWeekCount}
                    negative
                    tooltip={
                        (
                            <FormattedMessage
                                id='widget.tooltip'
                                defaultMessage='Increase/Decrease compared to last week'
                            />
                        )
                    }
                />
            </div>
        </div>
    );
}

APIMApiFaultsSummary.propTypes = {
    themeName: PropTypes.string.isRequired,
    thisWeekCount: PropTypes.string.isRequired,
    lastWeekCount: PropTypes.string.isRequired,
};
