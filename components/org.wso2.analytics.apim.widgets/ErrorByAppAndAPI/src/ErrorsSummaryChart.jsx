import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import PropTypes from 'prop-types';
import SummaryPieChart from './SummaryPieChart';
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import {ViewTypeEnum} from "../../AppAndAPIErrorTable/src/Constants";
import FormControl from "@material-ui/core/FormControl";
import Radio from '@material-ui/core/Radio';
import TextField from "@material-ui/core/TextField";
import {FormattedMessage} from "react-intl";
import {withStyles} from '@material-ui/core/styles';

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

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        marginBottom: 50,
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
});

function ErrorsSummaryChart(props) {
    const {
        totalRequestCounts, data4XX, total4XX, data5XX, total5XX, dataFaulty, totalFaulty,
        dataThrottled, totalThrottled, heading, handleViewChange, handleLimitChange, viewType, selectedLimit,
    } = props;

    let viewTypeName;
    if (viewType === ViewTypeEnum.API) {
        viewTypeName = 'APIs';
    }
    if (viewType === ViewTypeEnum.APP) {
        viewTypeName = 'Applications';
    }

    return (
        <div>
            <Table className={classes.table}>
                <TableBody>
                    <TableRow>
                        <FormControl component='fieldset'>
                            <RadioGroup
                                row
                                aria-label='viewType'
                                name='view'
                                value={viewType}
                                onChange={handleViewChange}
                            >
                                <FormControlLabel
                                    value={ViewTypeEnum.APP}
                                    control={<Radio />}
                                    label='By Applications'
                                />
                                <FormControlLabel value={ViewTypeEnum.API} control={<Radio />} label='By Apis' />
                            </RadioGroup>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <form style={styles.form} noValidate autoComplete='off'>
                                <TextField
                                    id='limit-number'
                                    label={<FormattedMessage id='limit' defaultMessage='Limit :' />}
                                    value={selectedLimit}
                                    onChange={handleLimitChange}
                                    type='number'
                                    // style={styles.formControl}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    margin='normal'
                                />
                            </form>
                        </FormControl>
                    </TableRow>
                    <TableRow>
                        <TableCell component='th' scope='row'>
                            <SummaryPieChart
                                heading={'4xx errors by ' + viewTypeName}
                                data={data4XX}
                                totalErrors={total4XX}
                                totalRequestCounts={totalRequestCounts}
                            />
                        </TableCell>
                        <TableCell align='right'>
                            <SummaryPieChart
                                heading={'5xx errors by ' + viewTypeName}
                                data={data5XX}
                                totalErrors={total5XX}
                                totalRequestCounts={totalRequestCounts}
                            />
                        </TableCell>
                        <TableCell align='right'>
                            <SummaryPieChart
                                heading={'Faulty summary by ' + viewTypeName}
                                data={dataFaulty}
                                totalErrors={totalFaulty}
                                totalRequestCounts={totalRequestCounts}
                            />
                        </TableCell>
                        <TableCell align='right'>
                            <SummaryPieChart
                                heading={'Throttled summary by ' + viewTypeName}
                                data={dataThrottled}
                                totalErrors={totalThrottled}
                                totalRequestCounts={totalRequestCounts}
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

ErrorsSummaryChart.propTypes = {
    data4XX: PropTypes.instanceOf(Object).isRequired,
    data5XX: PropTypes.instanceOf(Object).isRequired,
    dataFaulty: PropTypes.instanceOf(Object).isRequired,
    dataThrottled: PropTypes.instanceOf(Object).isRequired,
    total4XX: PropTypes.number.isRequired,
    total5XX: PropTypes.number.isRequired,
    totalFaulty: PropTypes.number.isRequired,
    totalThrottled: PropTypes.number.isRequired,
    totalRequestCounts: PropTypes.number.isRequired,
    heading: PropTypes.string.isRequired,
};

export default withStyles(styles)(ErrorsSummaryChart);
