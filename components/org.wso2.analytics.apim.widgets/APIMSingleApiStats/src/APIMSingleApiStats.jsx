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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
import AppBar from './AppBar';
import DetailBar from './DetailBar';
import Trafficchart from './Trafficchart';
import LatencyChart from './LatencyChart';
import ErrorDetailChart from './ErrorDetailChart';
import ErrorAnalysisChart from './ErrorAnalysisChart';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Scrollbars } from 'react-custom-scrollbars';



/**
 * React Component for APIM Single Api Stats widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Single Api Stats widget body
 */
export default function APIMSingleApiStats(props) {
    const {themeName, height, usageData, data, apiname, totalreqcount, trafficdata, latencydata, totallatencycount, totalerrorcount, errordata, avglatency, formatederrorpercentage, sorteddata, timeFrom, timeTo, apiVersion, apiList, apiSelected, apiSelectedHandleChange, isloading} = props;

    const styles = {
        mainDiv: {
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
            height,
            margin: '10px',
            padding: '20px',
        },
        inProgress: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '75%',
            padding: '4%',
            border: '1.5px solid',
            marginLeft:'5%',
            marginTop: '5%',
        },
        chart: {
            width: '50%', 
            float: 'left',
        },
    }
    return (
        <Scrollbars style={{height}}>
            <div>
                { isloading ? (
                     <div style={styles.inProgress}>
                        <CircularProgress />
                    </div>
                ) : (
                    <div>
                        {apiList.length > 0 ? (
                            <div>
                            <AppBar apiname={apiname} apiVersion={apiVersion} apiList={apiList} apiSelected={apiSelected} apiSelectedHandleChange={apiSelectedHandleChange}/>
                            <DetailBar totalreqcount={totalreqcount} totalerrorcount={totalerrorcount} avglatency={avglatency} formatederrorpercentage={formatederrorpercentage} timeFrom={timeFrom} timeTo={timeTo} totallatencycount={totallatencycount}/>
                            <div style={styles.chart}>
                            <Trafficchart trafficdata={trafficdata}/>
                            </div>
                            <div style={styles.chart}>
                            <LatencyChart latencydata={latencydata}/>
                            </div>
                            <div style={styles.chart}>
                            <ErrorDetailChart errordata={errordata}/>
                            </div>
                            <div style={styles.chart}>
                            <ErrorAnalysisChart sorteddata={sorteddata}/>
                            </div>
                        </div>
                        ) : (
                            <div style={styles.paperWrapper}>
                            <Paper
                                elevation={1}
                                style={styles.paper}
                            >
                                <Typography variant='h5' component='h3'>
                                    <FormattedMessage
                                        id='nodata.error.heading'
                                        defaultMessage='No Data Available !'
                                    />
                                </Typography>
                                <Typography component='p'>
                                    <FormattedMessage
                                        id='nodata.error.body'
                                        defaultMessage='No data available for the selected options.'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                        )
                        }
                    </div>
                )

                }
            </div>

        </Scrollbars>
    );
}

APIMSingleApiStats.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    usageData: PropTypes.instanceOf(Object).isRequired,
};
