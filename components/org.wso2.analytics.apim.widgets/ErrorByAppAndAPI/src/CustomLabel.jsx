import React from 'react';
import {
    VictoryLabel, VictoryTooltip,
} from 'victory';
import PropTypes from 'prop-types';
// import CustomInfoTitle from './CustomInfoTitle';

class CustomLabel extends React.Component {
    static defaultEvents = VictoryTooltip.defaultEvents;

    render() {
        const { totalRequestCounts } = this.props;
        return (
            <g>
                <VictoryLabel {...this.props} />
                <VictoryTooltip
                    {...this.props}
                    labelComponent={(
                        <VictoryLabel
                            text={e => [e.datum.x, e.datum.y, ((e.datum.y * 100) / totalRequestCounts).toFixed(2) + '%']}
                        />
                    )}
                    orientation='top'
                    style={{ fill: 'black' }}
                    constrainToVisibleArea
                    // flyoutWidth={90}
                    flyoutHeight={60}
                />
            </g>
        );
    }
}

CustomLabel.propTypes = {
    totalRequestCounts: PropTypes.number.isRequired,
};

export default CustomLabel;
