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
import MoreIcon from '@material-ui/icons/More';
import Button from '@material-ui/core/Button';
import { SummaryWidget } from '@analytics-apim/common-lib';


/**
 * React Component for APIM Api Usage widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Api Usage Count widget body
 */
export default function APIMSubscriptions(props) {
    const { themeName, thisWeekCount, lastWeekCount } = props;
    const styles = {
        root: {
            backgroundColor: themeName === 'light' ? '#fff' : '#0e1e34',
            height: '100%',
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
    };
    return (
        <div
            style={styles.root}
        >
            <div style={styles.headingWrapper}>
                <h3
                    style={styles.heading}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='API USAGE SUMMARY' />
                </h3>
            </div>
            <div style={styles.dataWrapper}>
                <SummaryWidget
                    themeName={themeName}
                    thisWeekCount={thisWeekCount}
                    lastWeekCount={lastWeekCount}
                    tooltip={
                        (
                            <FormattedMessage
                                id='widget.tooltip'
                                defaultMessage='Increase/Decrease compared to last week'
                            />
                        )
                    }
                />
                <div style={{ float: 'right' }}>
                    <Button
                        variant='outlined'
                        size='small'
                        style={styles.moreButton}
                        onClick={() => {
                            window.location.href = window.contextPath
                                // eslint-disable-next-line max-len
                                + '/dashboards/apimpublisher/developer-stats#{"dtrp":{"tr":"3months","g":"month","sync":false},"subscriptions":{"apiCreatedBy":"All","subscribedTo":"All"}}';
                        }}
                    >
                        <MoreIcon style={{ marginRight: 5, transform: 'scaleX(-1)' }} />
                        More
                    </Button>
                </div>
            </div>
        </div>
    );
}

APIMSubscriptions.propTypes = {
    themeName: PropTypes.string.isRequired,
    thisWeekCount: PropTypes.string.isRequired,
    lastWeekCount: PropTypes.string.isRequired,
};
