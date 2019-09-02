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

/**
 * Create React Component for Sub Icon
 * @function SubIcon
 * @param {object} props - strokeColor, width, height, style
 * @returns {ReactElement} Render the Sub Icon
 */
export default function SubIcon(props) {
    const {
        strokeColor, width, height, style,
    } = props;

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width={width}
            height={height}
            viewBox='0 0 6.5989004 6.5674281'
            id='svg8'
            style={style}
        >
            <g id='layer25' transform='translate(35.929 -86.734)'>
                <g transform='matrix(.66392 0 0 .66392 -39.893 53.694)' id='g10459' strokeLinecap='round'>
                    <circle
                        id='circle10453'
                        cx='8.138'
                        cy='57.583'
                        r='1.497'
                        fill={strokeColor}
                        strokeWidth='0.529'
                        strokeLinejoin='round'
                    />
                    <path
                        d='m 6.6416492,53.373914 c 2.7091648,-0.363432 5.5994938,2.122181 5.7062048,5.612659'
                        id='path10455'
                        fill='none'
                        stroke={strokeColor}
                        strokeWidth='1.323'
                    />
                    <path
                        id='path10457'
                        d='m 6.7351935,50.47404 c 5.1370835,-0.52388 7.9751195,3.245055 8.5125345,8.512533'
                        fill='none'
                        stroke={strokeColor}
                        strokeWidth='1.323'
                    />
                </g>
            </g>
        </svg>
    );
}

SubIcon.propTypes = {
    strokeColor: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    style: PropTypes.shape({}).isRequired,
};
