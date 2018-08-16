import _isObject from "lodash/isObject";
import _pick from "lodash/pick";
import _isFunction from "lodash/isFunction";
import _defaults from "lodash/defaults";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React from "react";
import PropTypes from "prop-types";
import VictoryAnimation from "../victory-animation/victory-animation";
import Collection from "../victory-util/collection";
import Helpers from "../victory-util/helpers";
import Timer from "../victory-util/timer";
import Transitions from "../victory-util/transitions";

var VictoryTransition = function (_React$Component) {
  _inherits(VictoryTransition, _React$Component);

  function VictoryTransition(props) {
    _classCallCheck(this, VictoryTransition);

    var _this = _possibleConstructorReturn(this, (VictoryTransition.__proto__ || Object.getPrototypeOf(VictoryTransition)).call(this, props));

    _this.state = {
      nodesShouldLoad: false,
      nodesDoneLoad: false
    };
    var child = _this.props.children;
    var polar = child.props.polar;
    _this.continuous = !polar && child.type && child.type.continuous === true;
    _this.getTransitionState = _this.getTransitionState.bind(_this);
    _this.getTimer = _this.getTimer.bind(_this);
    return _this;
  }

  _createClass(VictoryTransition, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.setState({ nodesShouldLoad: true }); //eslint-disable-line react/no-did-mount-set-state
    }
  }, {
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      var _this2 = this;

      this.getTimer().bypassAnimation();
      this.setState(this.getTransitionState(this.props, nextProps), function () {
        return _this2.getTimer().resumeAnimation();
      });
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.getTimer().stop();
    }
  }, {
    key: "getTimer",
    value: function getTimer() {
      if (this.context.getTimer) {
        return this.context.getTimer();
      }
      if (!this.timer) {
        this.timer = new Timer();
      }
      return this.timer;
    }
  }, {
    key: "getTransitionState",
    value: function getTransitionState(props, nextProps) {
      var animate = props.animate;

      if (!animate) {
        return {};
      } else if (animate.parentState) {
        var state = animate.parentState;
        var oldProps = state.nodesWillExit ? props : null;
        return { oldProps: oldProps, nextProps: nextProps };
      } else {
        var oldChildren = React.Children.toArray(props.children);
        var nextChildren = React.Children.toArray(nextProps.children);

        var _Transitions$getIniti = Transitions.getInitialTransitionState(oldChildren, nextChildren),
            nodesWillExit = _Transitions$getIniti.nodesWillExit,
            nodesWillEnter = _Transitions$getIniti.nodesWillEnter,
            childrenTransitions = _Transitions$getIniti.childrenTransitions,
            nodesShouldEnter = _Transitions$getIniti.nodesShouldEnter;

        return {
          nodesWillExit: nodesWillExit,
          nodesWillEnter: nodesWillEnter,
          childrenTransitions: childrenTransitions,
          nodesShouldEnter: nodesShouldEnter,
          oldProps: nodesWillExit ? props : null,
          nextProps: nextProps
        };
      }
    }
  }, {
    key: "getDomainFromChildren",
    value: function getDomainFromChildren(props, axis) {
      var getChildDomains = function (children) {
        return children.reduce(function (memo, child) {
          if (child.type && _isFunction(child.type.getDomain)) {
            var childDomain = child.props && child.type.getDomain(child.props, axis);
            return childDomain ? memo.concat(childDomain) : memo;
          } else if (child.props && child.props.children) {
            return memo.concat(getChildDomains(React.Children.toArray(child.props.children)));
          }
          return memo;
        }, []);
      };

      var child = React.Children.toArray(props.children)[0];
      var childProps = child.props || {};
      var domain = Array.isArray(childProps.domain) ? childProps.domain : childProps.domain && childProps.domain[axis];
      if (!childProps.children && domain) {
        return domain;
      } else {
        var childDomains = getChildDomains([child]);
        return childDomains.length === 0 ? [0, 1] : [Collection.getMinValue(childDomains), Collection.getMaxValue(childDomains)];
      }
    }
  }, {
    key: "pickProps",
    value: function pickProps() {
      if (!this.state) {
        return this.props;
      }
      return this.state.nodesWillExit ? this.state.oldProps || this.props : this.props;
    }
  }, {
    key: "pickDomainProps",
    value: function pickDomainProps(props) {
      var parentState = _isObject(props.animate) && props.animate.parentState;
      if (parentState && parentState.nodesWillExit) {
        return this.continous || parentState.continuous ? parentState.nextProps || this.state.nextProps || props : props;
      }
      return this.continuous && this.state.nodesWillExit ? this.state.nextProps || props : props;
    }
  }, {
    key: "getClipWidth",
    value: function getClipWidth(props, child) {
      var getDefaultClipWidth = function () {
        var range = Helpers.getRange(child.props, "x");
        return range ? Math.abs(range[1] - range[0]) : props.width;
      };
      var clipWidth = this.transitionProps ? this.transitionProps.clipWidth : undefined;
      return clipWidth !== undefined ? clipWidth : getDefaultClipWidth();
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var props = this.pickProps();
      var getTransitionProps = _isObject(this.props.animate) && this.props.animate.getTransitions ? this.props.animate.getTransitions : Transitions.getTransitionPropsFactory(props, this.state, function (newState) {
        return _this3.setState(newState);
      });
      var child = React.Children.toArray(props.children)[0];
      var transitionProps = getTransitionProps(child);
      this.transitionProps = transitionProps;
      var domain = {
        x: this.getDomainFromChildren(this.pickDomainProps(props), "x"),
        y: this.getDomainFromChildren(props, "y")
      };
      var clipWidth = this.getClipWidth(props, child);
      var combinedProps = _defaults({ domain: domain, clipWidth: clipWidth }, transitionProps, child.props);
      var animationWhitelist = props.animationWhitelist || [];
      var whitelist = animationWhitelist.concat(["clipWidth"]);
      var propsToAnimate = whitelist.length ? _pick(combinedProps, whitelist) : combinedProps;
      return React.createElement(
        VictoryAnimation,
        _extends({}, combinedProps.animate, { data: propsToAnimate }),
        function (newProps) {
          if (child.props.groupComponent) {
            var groupComponent = _this3.continuous ? React.cloneElement(child.props.groupComponent, { clipWidth: newProps.clipWidth || 0 }) : child.props.groupComponent;
            return React.cloneElement(child, _defaults({ animate: null, animating: true, groupComponent: groupComponent }, newProps, combinedProps));
          }
          return React.cloneElement(child, _defaults({ animate: null, animating: true }, newProps, combinedProps));
        }
      );
    }
  }]);

  return VictoryTransition;
}(React.Component);

VictoryTransition.displayName = "VictoryTransition";
VictoryTransition.propTypes = {
  animate: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  animationWhitelist: PropTypes.array,
  children: PropTypes.node
};
export default VictoryTransition;