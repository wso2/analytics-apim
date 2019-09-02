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
import APIMSignupsData from './APIMSignupsData';

/**
 * React Component for APIM Signups Analytics widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Signups Analytics widget body
 */
export default function APIMSignupsAnalytics(props) {
    const {
        themeName, height, chartData, tableData, xAxisTicks, maxCount,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            width: '97%',
            marginBottom: '5%',
        },
    };
    const signedDataProps = {
        themeName, chartData, tableData, xAxisTicks, maxCount,
    };
    return (
        <Scrollbars
            style={{ height }}
        >
            <div
                style={{
                    background: themeName === 'dark' ? '#0e1e33' : '#fff',
                    width: '85%',
                    padding: '5% 5%',
                    margin: '1.5% auto',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        width: '50%',
                        paddingBottom: '15px',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='DEVELOPER SIGNUPS OVER TIME' />
                    </div>
                </div>
                <APIMSignupsData {...signedDataProps} />
            </div>
        </Scrollbars>
    );
}

APIMSignupsAnalytics.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    chartData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    xAxisTicks: PropTypes.instanceOf(Object).isRequired,
    maxCount: PropTypes.number.isRequired,
};
