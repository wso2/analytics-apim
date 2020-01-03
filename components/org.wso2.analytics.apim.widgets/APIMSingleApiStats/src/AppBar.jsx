import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const styles = theme => ( {
    root: {
      flexGrow: 1,
      
    },
    dropdown: {
        // alignItems: 'right',
        // justifyContent: 'center',
        float: 'right',
        
    },

  });

class AppBars extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
        };
    }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { classes, apiname } = this.props;
    const { anchorEl } = this.state;

    return (
        <div>
        <div>
        <AppBar position="static" color="default">
            <Toolbar>
                <Typography variant="h8" color="inherit">
                    {'Recent API Traffic'} {'        '} {' > '} {'         '}{apiname}
                </Typography>
                <div>
                    <Button style={{marginLeft: '1400px'}}
                    aria-owns={anchorEl ? 'simple-menu' : undefined}
                    aria-haspopup="true"
                    onClick={this.handleClick}
                    >
                    Method
                    </Button>
                    <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                    >
                    <MenuItem onClick={this.handleClose}>Get</MenuItem>
                    <MenuItem onClick={this.handleClose}>Post</MenuItem>
                    <MenuItem onClick={this.handleClose}>Delete</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
        </div>
        
      </div>
    );
  }
}

export default withStyles(styles)(AppBars);