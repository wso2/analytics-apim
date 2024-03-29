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
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import APIMSubscriptionsData from './APIMSubscriptionsData';

/**
 * React Component for APIM Subscriptions Analytics widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Subscriptions Analytics widget body
 */
export default function APIMSubscriptionsAnalytics(props) {
    const {
        themeName, height, width, chartData, tableData, inProgress, handleOnClickAPI, username, limit,
        handleLimitChange, timeTo, timeFrom,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        loading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        heading: {
            margin: 'auto',
            textAlign: 'center',
            fontWeight: 'normal',
            letterSpacing: 1.5,
            paddingBottom: '10px',
            marginTop: 0,
        },
        formWrapper: {
            paddingBottom: 20,
        },
        formControl: {
            marginLeft: 10,
            marginTop: 10,
            width: '10%',
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };
    const subDataProps = {
        themeName, chartData, tableData, width, username, timeTo, timeFrom,
    };
    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div
                style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    margin: '10px',
                    padding: '20px',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={styles.heading}>
                        <FormattedMessage id='widget.heading' defaultMessage='SUBSCRIPTIONS OVER TIME' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form noValidate autoComplete='off'>
                        <FormControl style={styles.formControl}>
                            <InputLabel
                                shrink
                                style={styles.formLabel}
                            >
                                <FormattedMessage id='limit' defaultMessage='Limit' />
                            </InputLabel>
                            <Input
                                value={limit}
                                onChange={handleLimitChange}
                                type='number'
                                margin='normal'
                            />
                        </FormControl>
                    </form>
                </div>
                {inProgress
                    ? (
                        <div style={styles.loading}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    )
                    : (
                        <APIMSubscriptionsData
                            {...subDataProps}
                            onClickAPI={e => handleOnClickAPI(e)}
                        />
                    )
                }
            </div>
        </Scrollbars>
    );
}

APIMSubscriptionsAnalytics.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired,
    chartData: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
    inProgress: PropTypes.bool.isRequired,
    handleOnClickAPI: PropTypes.func.isRequired,
    username: PropTypes.string.isRequired,
    handleLimitChange: PropTypes.func.isRequired,
    limit: PropTypes.string.isRequired,
};
