import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Select from 'react-select';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import NoSsr from '@material-ui/core/NoSsr';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import CancelIcon from '@material-ui/icons/Cancel';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import { FormattedMessage } from 'react-intl';
import InputLabel from '@material-ui/core/InputLabel';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    input: {
        display: 'flex',
        padding: 0,
    },
    valueContainer: {
        display: 'flex',
        // flexWrap: 'wrap',
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
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
    formLabel: {
        marginBottom: theme.spacing.unit * 2,
    },
});

class IntegrationReactSelect extends React.Component {
    constructor(props) {
        super(props);

        this.getNoOptionsMessage = this.getNoOptionsMessage.bind(this);
        this.getInputComponent = this.getInputComponent.bind(this);
        this.getControl = this.getControl.bind(this);
        this.getOption = this.getOption.bind(this);
        this.getPlaceholder = this.getPlaceholder.bind(this);
        this.getSingleValue = this.getSingleValue.bind(this);
        this.getValueContainer = this.getValueContainer.bind(this);
        this.getMultiValue = this.getMultiValue.bind(this);
        this.getMenu = this.getMenu.bind(this);
        this.getLabel = this.getLabel.bind(this);
    }

    getNoOptionsMessage(props) {
        return (
            <Typography
                color='textSecondary'
                className={props.selectProps.classes.noOptionsMessage}
                {...props.innerProps}
            >
                {props.children}
            </Typography>
        );
    }

    getInputComponent({ inputRef, ...props }) {
        return <div ref={inputRef} {...props} />;
    }

    getControl(props) {
        return (
            <TextField
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
        return (
            <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
                {props.children}
            </Paper>
        );
    }

    getLabel() {
        const { classes, displayName } = this.props;
        if (displayName) {
            return (
                <InputLabel
                    shrink
                    htmlFor='limit-number'
                    classes={classes.formLabel}
                    style={{ position: 'relative' }}
                >
                    <FormattedMessage id={'select.' + displayName} defaultMessage={displayName} />
                </InputLabel>
            );
        }
        return null;
    }

    render() {
        const {
            classes, theme, isMulti, options, onChange, placeholder, value, getLabel, getValue,
        } = this.props;
        if (options.length === 0) {
            return '';
        }
        let selected = null;
        if (Array.isArray(value)) {
            selected = value.filter(val => options.filter(op => getValue(op) === val).length > 0)
                .map((val) => {
                    const item = options.find(op => getValue(op) === val);
                    return { value: getValue(item), label: getLabel(item) };
                });
        } else {
            const selectedItem = options.find(i => getValue(i) === value);
            if (selectedItem) {
                selected = {
                    value: getValue(selectedItem),
                    label: getLabel(selectedItem),
                };
            }
        }
        if (!selected) {
            selected = null;
        }
        const newOptions = options.map((row) => {
            return {
                value: getValue(row),
                label: getLabel(row),
            };
        });
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
            Option: this.getOption,
            Placeholder: this.getPlaceholder,
            SingleValue: this.getSingleValue,
            ValueContainer: this.getValueContainer,
        };

        return (
            <div className={classes.root}>
                {this.getLabel()}
                <NoSsr>
                    { isMulti
                        ? (
                            <Select
                                classes={classes}
                                styles={selectStyles}
                                options={newOptions}
                                components={components}
                                value={selected}
                                onChange={onChange}
                                placeholder={placeholder}
                                isMulti
                            />
                        ) : (
                            <Select
                                classes={classes}
                                styles={selectStyles}
                                options={newOptions}
                                components={components}
                                value={selected}
                                onChange={onChange}
                                placeholder={placeholder}
                                isClearable
                            />
                        )}
                </NoSsr>
            </div>
        );
    }
}

IntegrationReactSelect.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    theme: PropTypes.instanceOf(Object).isRequired,
    isMulti: PropTypes.bool.isRequired,
    options: PropTypes.instanceOf(Object).isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string.isRequired,
    getLabel: PropTypes.func.isRequired,
    getValue: PropTypes.func.isRequired,
    displayName: PropTypes.string.isRequired,
    value: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles, { withTheme: true })(IntegrationReactSelect);
