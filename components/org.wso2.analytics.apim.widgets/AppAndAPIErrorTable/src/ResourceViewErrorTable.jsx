import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import Paper from '@material-ui/core/Paper';
import { Divider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ViewTypeEnum, ValueFormatType } from './Constants';

const styles = theme => ({
    table: {
        minWidth: 650,
        maxWidth: 650,
        minHeight: 400,
        marginBottom: 50,
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
});

class ResourceViewErrorTable extends React.Component {

    constructor(props) {
        super(props);
        this.getTableHeadRowsForAPI = this.getTableHeadRowsForAPI.bind(this);
    }

    getTableHeadRowsForAPI() {
        const { viewType, valueFormatType, data } = this.props;
        return (
            <Table className={styles.table} aria-label='simple table'>
                <TableHead>
                    <TableRow>
                        { viewType === ViewTypeEnum.APP ? <TableCell>Application</TableCell> : '' }
                        <TableCell align='right'>Operation</TableCell>
                        <TableCell align='right'>4xx</TableCell>
                        <TableCell align='right'>5xx</TableCell>
                        <TableCell align='right'>Total Errors</TableCell>
                        <TableCell align='right'>Total Faulty</TableCell>
                        <TableCell align='right'>Total Throttled</TableCell>
                        <TableCell align='right'>Total Success</TableCell>
                        <TableCell align='right'>Total Requests</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map(row => {
                        const {
                            applicationName, applicationOwner, apiResourceTemplate, apiMethod,
                        } = row;
                        let {
                            _4xx, _5xx, faultCount, throttledCount, successCount
                        } = row;
                        const appName = applicationName + ' ( ' + applicationOwner + ' )';
                        const operation = apiResourceTemplate + ' ( ' + apiMethod + ' )';
                        let totalErrors = _4xx + _5xx;
                        const totalRequests = successCount + faultCount + throttledCount;
                        if (valueFormatType === ValueFormatType.PERCENT) {
                            _4xx = ((_4xx * 100) / totalRequests).toFixed(2) + ' %';
                            _5xx = ((_5xx * 100) / totalRequests).toFixed(2) + ' %';
                            totalErrors = ((totalErrors * 100) / totalRequests).toFixed(2) + ' %';
                            faultCount = ((faultCount * 100) / totalRequests).toFixed(2) + ' %';
                            throttledCount = ((throttledCount * 100) / totalRequests).toFixed(2) + ' %';
                            successCount = ((successCount * 100) / totalRequests).toFixed(2) + ' %';
                        }
                        return (
                            <TableRow key={row.apiName}>
                                { viewType === ViewTypeEnum.APP ? (
                                    <TableCell>
                                        {appName}
                                    </TableCell>
                                ) : '' }
                                <TableCell align='right'>{operation}</TableCell>
                                <TableCell align='right'>{_4xx}</TableCell>
                                <TableCell align='right'>{_5xx}</TableCell>
                                <TableCell align='right'>{totalErrors}</TableCell>
                                <TableCell align='right'>{faultCount}</TableCell>
                                <TableCell align='right'>{throttledCount}</TableCell>
                                <TableCell align='right'>{successCount}</TableCell>
                                <TableCell align='right'>{totalRequests}</TableCell>
                            </TableRow>
                        );
                    })}
                    <TableRow />
                    <TableRow />
                </TableBody>
            </Table>
        );
    }

    render() {
        return (
            <div component={Paper}>
                <Divider m={10} />
                { this.getTableHeadRowsForAPI() }
            </div>
        );
    }
}

ResourceViewErrorTable.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(ResourceViewErrorTable);
