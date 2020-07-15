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
import {
    VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme, VictoryContainer,
} from 'victory';
import { colorScale } from '@analytics-apim/common-lib';
import sumBy from 'lodash/sumBy';

/**
 * React Component for Api Availability Chart
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Availability Chart
 */
export default function ApiAvailability(props) {
    const { availableApiData, legendData, handleOnClick } = props;
    const styles = {
        pieChart: {
            data: {
                cursor: 'pointer',
            },
        },
    };

    return (
        <div>
            <VictoryContainer height={400}>
                <VictoryLegend
                    standalone={false}
                    theme={VictoryTheme.material}
                    colorScale={['#45b29d', '#ff9800', '#ef5350']}
                    x={380}
                    y={20}
                    gutter={20}
                    style={{
                        labels: {
                            fill: '#9e9e9e',
                        },
                    }}
                    data={legendData}
                />
                <VictoryPie
                    labelComponent={(
                        <VictoryTooltip
                            orientation='right'
                            theme={VictoryTheme.material}
                            pointerLength={0}
                            cornerRadius={2}
                            flyoutStyle={{
                                fill: '#000',
                                fillOpacity: '0.5',
                                strokeWidth: 1,
                            }}
                            style={{ fill: '#fff' }}
                        />
                    )}
                    innerRadius={80}
                    theme={VictoryTheme.material}
                    standalone={false}
                    colorScale={colorScale}
                    style={styles.pieChart}
                    data={availableApiData}
                    x={0}
                    y={1}
                    labels={d => `${d[0]} : ${((d[1] / (sumBy(availableApiData, o => o[1]))) * 100).toFixed(2)}%`}
                    events={[
                        {
                            target: 'data',
                            eventHandlers: {
                                onClick: (e) => {
                                    return [{
                                        mutation: (val) => {
                                            handleOnClick(e, val.datum);
                                        },
                                    }];
                                },
                            },
                        },
                    ]}
                />
            </VictoryContainer>
        </div>
    );
}

ApiAvailability.propTypes = {
    availableApiData: PropTypes.instanceOf(Object).isRequired,
    legendData: PropTypes.instanceOf(Object).isRequired,
    handleOnClick: PropTypes.func.isRequired,
};
