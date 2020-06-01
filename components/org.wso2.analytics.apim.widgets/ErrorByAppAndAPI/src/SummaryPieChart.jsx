import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import {
    VictoryPie,
} from 'victory';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import CustomLabel from './CustomLabel';

const classes = {
    table: {
        minWidth: 650,
        maxWidth: 650,
        marginBottom: 50,
        padding: 0,
    },
    formControl: {
        // margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        // marginTop: theme.spacing(2),
    },

    dataWrapper: {
        margin: 'auto',
        textAlign: 'center',
        fontSize: '100%',
        fontWeight: 500,
        // paddingTop: 10,
        marginTop: '10%',
        marginBottom: '10%',
        display: 'flex',
        justifyContent: 'center',
    },
    leftContainer: {
        justifyContent: 'flex-start',
        // marginLeft: '5%',
        marginRight: '10%',
    },
    rightContainer: {
        justifyContent: 'flex-end',
        // marginLeft: '10%',
        marginRight: '5%',
    },
    dataBlock: {
        fontSize: '130%',
        // marginTop: '10%',
    },
    pieChart: {
        labels: {
            fill: 'white',
            fontSize: 15,
        },
        parent: { margin: 0 },
    },
};

const colorScale = ['tomato', 'orange', 'gold', 'cyan', 'navy'];

export default function SummaryPieChart(props) {
    const {
        data, totalErrors, totalRequestCounts, heading,
    } = props;
    const apiErrorsPerCent = ((totalErrors * 100) / totalRequestCounts).toFixed(2);

    return (
        <div>
            <Table className={classes.table}>
                <TableBody>
                    <TableRow>
                        <TableCell component='th' scope='row'>
                            <h3>{heading}</h3>
                            {data.length === 0 ? (<div>No data</div>)
                                : (
                                    <VictoryPie
                                        colorScale={colorScale}
                                        data={data}
                                        // height={250}
                                        style={classes.pieChart}
                                        labelComponent={<CustomLabel totalRequestCounts={totalRequestCounts} />}
                                    />
                                )
                            }
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell component='th' scope='row'>
                            <div style={classes.dataWrapper}>
                                <div style={classes.leftContainer}>
                                    <FormattedMessage
                                        id='sub.heading.error.count'
                                        defaultMessage='No of Errors'
                                    />
                                    <div style={classes.dataBlock}>{totalErrors}</div>
                                </div>
                                <div style={classes.rightContainer}>
                                    <FormattedMessage
                                        id='sub.heading.error.percentage'
                                        defaultMessage='Error Percentage'
                                    />
                                    <div style={classes.dataBlock}>
                                        {apiErrorsPerCent}
                                        {' '}
                                        {'%'}
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

SummaryPieChart.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    totalErrors: PropTypes.number.isRequired,
    totalRequestCounts: PropTypes.number.isRequired,
    heading: PropTypes.string.isRequired,
};
