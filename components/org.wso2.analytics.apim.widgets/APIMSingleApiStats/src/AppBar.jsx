import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';

const styles = ( {
    root: {
      flexGrow: 1,
      
    },
    formControl: {
      marginLeft: '60%',
      float: 'right',
      width: '20%',
  },
  formLabel: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: '100%',
    display: 'block',
    overflow: 'hidden',
},

  });

class AppBars extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  render() {
    const { apiname, apiVersion, apiList, apiSelected, apiSelectedHandleChange } = this.props;

    return (
        <div>
        <AppBar position="static" color="default">
            <Toolbar>
                <Typography variant="h8" color="inherit">
                    {'API Statistics'} {'        '} {' > '} {'         '}{apiname}{' '}{'('}{apiVersion}{')'}
                </Typography>
                <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='apiName.label' defaultMessage='API Name' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='apiSelected-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='apiName.label' defaultMessage='API Name' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={apiSelected}
                                onChange={apiSelectedHandleChange}
                                input={<Input name='apiSelected' id='apiSelected-label-placeholder' />}
                                displayEmpty
                                name='apiSelected'
                            >
                                {
                                    apiList.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                  </FormControl>
            </Toolbar>
        </AppBar>
        </div>
    );
  }
}

export default withStyles(styles)(AppBars);