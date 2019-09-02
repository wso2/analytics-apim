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
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VizG from 'react-vizgrammar';

/**
 * React Component for APIM Geo Based Invocations widget data
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Geo Based Invocations widget data
 */
export default function APIMGeoInvocations(props) {
    const {
        themeName, chartConfig, metadata, width, geoData,
    } = props;
    const styles = {
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: '#969696',
            width: '75%',
            padding: '4%',
            border: '1.5px solid #fff',
            margin: 'auto',
            marginTop: '5%',
        },
        dataWrapper: {
            height: '80%',
        },
    };
    if (geoData.length === 0) {
        return (
            <div style={styles.paperWrapper}>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography variant='h5' component='h3'>
                        <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options.'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    }
    return (
        <div style={styles.dataWrapper}>
            <VizG
                config={chartConfig}
                metadata={metadata}
                data={geoData}
                width={width}
                theme={themeName}
            />
        </div>
    );
}

APIMGeoInvocations.propTypes = {
    themeName: PropTypes.string.isRequired,
    chartConfig: PropTypes.instanceOf(Object).isRequired,
    metadata: PropTypes.instanceOf(Object).isRequired,
    width: PropTypes.string.isRequired,
    geoData: PropTypes.instanceOf(Object).isRequired,
};
