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
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Collapse from '@material-ui/core/Collapse';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
    },
    title: {
        position: 'absolute',
        top: 0,
        left: 0,
        marginTop: '20px',
        marginLeft: '20px',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: '40%',
        marginTop: 0,
    },
    menu: {
        width: 150,
    },
    actions: {
        position: 'absolute',
        top: 0,
        right: 0,
        marginTop: '10px',
        marginRight: '10px',
    },
    expand: {
        marginLeft: 'auto',
    },
    collapsef: {
        display: 'flex',
        marginLeft: 'auto',
        marginRight: 0,
        marginTop: '60px',
    },
});

/**
 * Create React Component for Custom Table Toolbar
 */
function CustomTableToolbar(props) {
    const {
        classes, handleExpandClick, expanded, filterColumn, handleColumnSelect, handleQueryChange, query,
    } = props;

    return (
        <Toolbar
            className={classes.root}
        >
            <div className={classes.title}>
                <Typography variant='h6' id='tableTitle'>
                    <FormattedMessage id='widget.heading' defaultMessage='TOP APP CREATORS' />
                </Typography>
            </div>
            <div className={classes.actions}>
                <Tooltip title={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}>
                    <IconButton
                        className={classes.expand}
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}
                    >
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
            </div>
            <Collapse in={expanded} timeout='auto' unmountOnExit className={classes.collapsef}>
                <div>
                    <TextField
                        id='column-select'
                        select
                        label={<FormattedMessage id='filter.column.menu.heading' defaultMessage='Column Name' />}
                        className={classes.textField}
                        value={filterColumn}
                        onChange={handleColumnSelect}
                        SelectProps={{
                            MenuProps: {
                                className: classes.menu,
                            },
                        }}
                        margin='normal'
                    >
                        <MenuItem value='creator'>
                            <FormattedMessage id='table.heading.creator' defaultMessage='CREATOR' />
                        </MenuItem>
                        <MenuItem value='appcount'>
                            <FormattedMessage id='table.heading.appcount' defaultMessage='APP COUNT' />
                        </MenuItem>
                    </TextField>
                    <TextField
                        id='query-search'
                        label={<FormattedMessage id='filter.search.placeholder' defaultMessage='Search Field' />}
                        type='search'
                        value={query}
                        className={classes.textField}
                        onChange={handleQueryChange}
                        margin='normal'
                    />
                </div>
            </Collapse>
        </Toolbar>
    );
}

CustomTableToolbar.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    expanded: PropTypes.string.isRequired,
    filterColumn: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    handleExpandClick: PropTypes.func.isRequired,
    handleColumnSelect: PropTypes.func.isRequired,
    handleQueryChange: PropTypes.func.isRequired,
};

export default withStyles(styles)(CustomTableToolbar);
