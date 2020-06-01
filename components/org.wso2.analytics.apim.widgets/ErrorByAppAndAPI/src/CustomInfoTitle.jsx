import React from 'react';
import PropTypes from 'prop-types';
import {
    VictoryLabel, VictoryTooltip,
} from 'victory';

const classes = {
    dataWrapper: {
        color: 'blue',
        background: 'red',
    },
};

export default function CustomInfoTitle(props) {
    const { totalErrors, text, datum: { y } } = props;
    const percent = ((y * 100) / totalErrors).toFixed(2);
    return (
        <VictoryLabel text={["first line", "second line"]}/>
    );
}

CustomInfoTitle.propTypes = {
    totalErrors: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    datum: PropTypes.instanceOf(Object).isRequired,
};
