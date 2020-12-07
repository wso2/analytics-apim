import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import NoSsr from '@material-ui/core/NoSsr';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CancelIcon from '@material-ui/icons/Cancel';
import { emphasize } from '@material-ui/core/styles/colorManipulator';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    input: {
        display: 'flex',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRadius: 4,
        borderColor: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
    },
    valueContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
        paddingLeft: 10,
    },
    chip: {
        margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
    },
    chipFocused: {
        backgroundColor: emphasize(
            theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
            0.08,
        ),
    },
    noOptionsMessage: {
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
    },
    singleValue: {
        fontSize: 16,
    },
    placeholder: {
        position: 'absolute',
        left: 2,
        fontSize: 16,
    },
    paper: {
        width: 'fit-content',
        position: 'absolute',
        zIndex: 1,
        marginTop: theme.spacing.unit,
        left: 0,
        right: 0,
    },
    divider: {
        height: theme.spacing.unit * 2,
    },
});

const DIMENSION_API = 'api';

let openPopper = false;
const popperAnchor = 'popper-anchor';

class Autocomplete extends React.Component {
    constructor(props) {
        super(props);

        this.getLoadingMessage = this.getLoadingMessage.bind(this);
        this.getNoOptionsMessage = this.getNoOptionsMessage.bind(this);
        this.getInputComponent = this.getInputComponent.bind(this);
        this.getControl = this.getControl.bind(this);
        this.getOption = this.getOption.bind(this);
        this.getPlaceholder = this.getPlaceholder.bind(this);
        this.getSingleValue = this.getSingleValue.bind(this);
        this.getValueContainer = this.getValueContainer.bind(this);
        this.getMultiValue = this.getMultiValue.bind(this);
        this.getMenu = this.getMenu.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.formatSelectionAndOptions = this.formatSelectionAndOptions.bind(this);
    }

    getLoadingMessage(props) {
        return (
            <Typography
                color='textSecondary'
                className={props.selectProps.classes.noOptionsMessage}
                {...props.innerProps}
            >
                <FormattedMessage
                    id='search.loading'
                    defaultMessage='Loading options...'
                />
            </Typography>
        );
    }

    getNoOptionsMessage(props) {
        const { noOptionsText, dimension } = this.props;
        return (
            <Typography
                color='textSecondary'
                className={props.selectProps.classes.noOptionsMessage}
                {...props.innerProps}
            >
                <FormattedMessage
                    id={dimension === DIMENSION_API ? 'no.options.api' : 'no.options.provider'}
                    defaultMessage={noOptionsText}
                />
            </Typography>
        );
    }

    getInputComponent({ inputRef, ...props }) {
        return <div ref={inputRef} {...props} />;
    }

    getControl(props) {
        openPopper = props.selectProps.menuIsOpen;
        return (
            <TextField
                id='popper-anchor'
                fullWidth
                InputProps={{
                    inputComponent: this.getInputComponent,
                    inputProps: {
                        className: props.selectProps.classes.input,
                        inputRef: props.innerRef,
                        children: props.children,
                        ...props.innerProps,
                    },
                }}
                {...props.selectProps.textFieldProps}
            />
        );
    }

    getOption(props) {
        const {
            innerRef, isFocused, isSelected, innerProps,
        } = props;
        return (
            <MenuItem
                buttonRef={innerRef}
                selected={isFocused}
                component='div'
                style={{
                    fontWeight: isSelected ? 500 : 400,
                }}
                {...innerProps}
            >
                {props.children}
            </MenuItem>
        );
    }

    getPlaceholder(props) {
        const { innerProps, children, selectProps: { classes: { placeholder } } } = props;
        return (
            <Typography
                color='textSecondary'
                className={placeholder}
                {...innerProps}
            >
                {children}
            </Typography>
        );
    }

    getSingleValue(props) {
        return (
            <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
                {props.children}
            </Typography>
        );
    }

    getValueContainer(props) {
        return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
    }

    getMultiValue(props) {
        return (
            <Chip
                tabIndex={-1}
                label={props.children}
                className={classNames(props.selectProps.classes.chip, {
                    [props.selectProps.classes.chipFocused]: props.isFocused,
                })}
                onDelete={props.removeProps.onClick}
                deleteIcon={<CancelIcon {...props.removeProps} />}
            />
        );
    }

    getMenu(props) {
        const popperNode = document.getElementById(popperAnchor);
        return (
            <Popper
                open={openPopper}
                anchorEl={popperNode}
                placement='bottom-start'
            >
                <Paper
                    square
                    className={props.selectProps.classes.paper}
                    style={{ width: popperNode ? popperNode.clientWidth : null }}
                    {...props.innerProps}
                >
                    {props.children}
                </Paper>
            </Popper>
        );
    }

    handleOnChange(event) {
        if (event) {
            const { onChange, selectMultiple } = this.props;
            if (selectMultiple) {
                onChange(event.map((e) => { return e.value; }));
            } else {
                onChange(event.value);
            }
        }
    }

    formatSelectionAndOptions(selectedOptions, options, selectMultiple, dimension) {
        let selection;
        let selcOpt;
        if (dimension === DIMENSION_API) {
            if (selectMultiple) {
                selection = [];
                if (selectedOptions.length > 0 && selectedOptions[0].name === 'All') {
                    selcOpt = options.find(opt => opt.name === 'All');
                    selection.push({ value: selcOpt, label: selcOpt.name });
                } else {
                    selectedOptions
                        .forEach((selc) => {
                            selcOpt = options
                                .find(opt => opt.name === selc.name && opt.version === selc.version
                                    && opt.provider === selc.provider);
                            selection.push({
                                value: selcOpt,
                                label: selcOpt.name + ' :: ' + selcOpt.version + ' (' + selcOpt.provider + ')',
                            });
                        });
                }
            } else if (selectedOptions.name === 'All') {
                selcOpt = options.find(opt => opt.name === 'All');
                selection = { value: selcOpt, label: selcOpt.name };
            } else {
                selcOpt = options
                    .find(opt => opt.name === selectedOptions.name && opt.version === selectedOptions.version
                        && opt.provider === selectedOptions.provider);
                selection = {
                    value: selcOpt,
                    label: selcOpt.name + ' :: ' + selcOpt.version + ' (' + selcOpt.provider + ')',
                };
            }
        } else if (selectMultiple) {
            selection = [];
            selectedOptions.forEach((selc) => {
                selcOpt = options.find(opt => opt === selc);
                selection.push({ value: selcOpt, label: selcOpt });
            });
        } else {
            selcOpt = options.find(opt => opt === selectedOptions);
            selection = { value: selcOpt, label: selcOpt };
        }

        const newOptions = options.map((val) => {
            if (dimension === DIMENSION_API) {
                return {
                    value: val,
                    label: val.name === 'All' ? val.name : val.name + ' :: ' + val.version + ' ('
                        + val.provider + ')',
                };
            } else {
                return { value: val, label: val };
            }
        });

        return { selection, newOptions };
    }

    render() {
        const {
            classes, theme, options, selectMultiple, selectedOptions, dimension,
        } = this.props;

        const selectStyles = {
            input: base => ({
                ...base,
                color: theme.palette.text.primary,
                '& input': {
                    font: 'inherit',
                },
            }),
        };

        const components = {
            Control: this.getControl,
            Menu: this.getMenu,
            MultiValue: this.getMultiValue,
            NoOptionsMessage: this.getNoOptionsMessage,
            loadingMessage: this.getLoadingMessage,
            Option: this.getOption,
            Placeholder: this.getPlaceholder,
            SingleValue: this.getSingleValue,
            ValueContainer: this.getValueContainer,
        };

        const { selection, newOptions } = this.formatSelectionAndOptions(selectedOptions, options,
            selectMultiple, dimension);
        const uniqueId = Date.now();

        return (
            <div className={classes.root}>
                <NoSsr>
                    <Select
                        key={uniqueId}
                        classes={classes}
                        styles={selectStyles}
                        options={newOptions}
                        components={components}
                        value={selection}
                        onChange={event => this.handleOnChange(event)}
                        isMulti={selectMultiple}
                        isClearable={false}
                        maxMenuHeight={400}
                    />
                </NoSsr>
            </div>
        );
    }
}

Autocomplete.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    theme: PropTypes.instanceOf(Object).isRequired,
    selectMultiple: PropTypes.bool.isRequired,
    options: PropTypes.instanceOf(Object).isRequired,
    onChange: PropTypes.func.isRequired,
    dimension: PropTypes.string.isRequired,
    noOptionsText: PropTypes.string.isRequired,
    selectedOptions: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles, { withTheme: true })(Autocomplete);
