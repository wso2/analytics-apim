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
import CustomTable from './CustomTable';
import PrimarySearchAppBar from './PrimarySearchAppBar';

/**
 * React Component for Recent Api Traffic widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Recent Api Traffic widget body
 */
export default function APIMRecentApiDetails(props) {
    const { height, usageData, totalcount } = props;
    return (
        <Scrollbars
            style={{ height }}
        >
            <div>
                {/* <div style={styles.headingWrapper}>
                    <h3 style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        marginLeft: '5px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        letterSpacing: 1.2,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='Recent Api Details' />
                        <FormattedMessage id='widget.subheading' defaultMessage='Recent' />
                    </h3>

                </div> */}
                <PrimarySearchAppBar />
                <CustomTable
                    usageData={usageData}
                    totalcount={totalcount}
                />
            </div>
        </Scrollbars>
    );
}

APIMRecentApiDetails.propTypes = {
    height: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
    totalcount: PropTypes.instanceOf(Object).isRequired,
};
