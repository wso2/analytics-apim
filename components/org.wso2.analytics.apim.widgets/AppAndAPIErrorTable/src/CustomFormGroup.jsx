import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import {withStyles} from '@material-ui/core/styles';
import { ViewTypeEnum, ValueFormatType, DrillDownEnum } from './Constants';
import TextField from "@material-ui/core/TextField";
import {FormattedMessage} from "react-intl";

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

function CustomFormGroup(props) {

    const {
        classes, viewType, drillDownType, selectedApp, selectedAPI, selectedVersion, selectedResource, apiList, appList,
        versionList, operationList, selectedLimit,
        handleApplicationChange, handleAPIChange, handleVersionChange, handleOperationChange, handleLimitChange,
    } = props;

    return (
        <div component={Paper}>
            <div>
                { viewType === ViewTypeEnum.APP ? (
                    <FormControl className={classes.formControl}>
                        <InputLabel id='demo-simple-select-label'>Application</InputLabel>
                        <Select
                            labelId='demo-simple-select-label'
                            id='demo-simple-select'
                            value={selectedApp}
                            onChange={handleApplicationChange}
                        >
                            <MenuItem value={-1}>All</MenuItem>
                            {appList.map((row,i) => (
                                <MenuItem value={i}>{row[0] + ' ( ' + row[1] + ' )'}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : '' }

                <FormControl className={classes.formControl}>
                    <InputLabel id='demo-simple-select-label'>API Name</InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={selectedAPI}
                        onChange={handleAPIChange}
                    >
                        <MenuItem value={-1}>All</MenuItem>
                        {apiList.map(row => (
                            <MenuItem value={row}>{row}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                { drillDownType === DrillDownEnum.VERSION || drillDownType === DrillDownEnum.RESOURCE ? (
                    <FormControl className={classes.formControl}>
                        <InputLabel id='demo-simple-select-label'>API Version</InputLabel>
                        <Select
                            labelId='demo-simple-select-label'
                            id='demo-simple-select'
                            value={selectedVersion}
                            onChange={handleVersionChange}
                            disabled={versionList && versionList.length === 0}
                        >
                            <MenuItem value={-1}>All</MenuItem>
                            {versionList.map((row, i) => (
                                <MenuItem value={i}>{row[1]}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : '' }

                { drillDownType === DrillDownEnum.RESOURCE ? (
                    <FormControl className={classes.formControl}>
                        <InputLabel id='demo-simple-select-label'>Operation</InputLabel>
                        <Select
                            labelId='demo-simple-select-label'
                            id='demo-simple-select'
                            value={selectedResource}
                            onChange={handleOperationChange}
                            disabled={operationList && operationList.length === 0}
                        >
                            <MenuItem value={-1}>All</MenuItem>
                            {operationList.map((row, i) => (
                                <MenuItem value={i}>{row[0] + ' ( ' + row[1] + ' )'}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : '' }

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
            </div>
        </div>
    );
}

CustomFormGroup.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomFormGroup);
