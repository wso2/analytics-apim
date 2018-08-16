Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _d3Ease = require("d3-ease");

var d3Ease = _interopRequireWildcard(_d3Ease);

var _util = require("./util");

var _timer = require("../victory-util/timer");

var _timer2 = _interopRequireDefault(_timer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*global setTimeout:false */


var VictoryAnimation = function (_React$Component) {
  _inherits(VictoryAnimation, _React$Component);

  function VictoryAnimation(props) {
    _classCallCheck(this, VictoryAnimation);

    /* defaults */
    var _this = _possibleConstructorReturn(this, (VictoryAnimation.__proto__ || Object.getPrototypeOf(VictoryAnimation)).call(this, props));

    _this.state = {
      data: Array.isArray(_this.props.data) ? _this.props.data[0] : _this.props.data,
      animationInfo: {
        progress: 0,
        animating: false
      }
    };
    _this.interpolator = null;
    _this.queue = Array.isArray(_this.props.data) ? _this.props.data.slice(1) : [];
    /* build easing function */
    _this.ease = d3Ease[_this.toNewName(_this.props.easing)];
    /*
      There is no autobinding of this in ES6 classes
      so we bind functionToBeRunEachFrame to current instance of victory animation class
    */
    _this.functionToBeRunEachFrame = _this.functionToBeRunEachFrame.bind(_this);
    _this.getTimer = _this.getTimer.bind(_this);
    return _this;
  }

  _createClass(VictoryAnimation, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // Length check prevents us from triggering `onEnd` in `traverseQueue`.
      if (this.queue.length) {
        this.traverseQueue();
      }
    }

    /* lifecycle */

  }, {
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      /* cancel existing loop if it exists */
      this.getTimer().unsubscribe(this.loopID);

      /* If an object was supplied */
      if (!Array.isArray(nextProps.data)) {
        // Replace the tween queue. Could set `this.queue = [nextProps.data]`,
        // but let's reuse the same array.
        this.queue.length = 0;
        this.queue.push(nextProps.data);
        /* If an array was supplied */
      } else {
        var _queue;

        /* Extend the tween queue */
        (_queue = this.queue).push.apply(_queue, _toConsumableArray(nextProps.data));
      }
      /* Start traversing the tween queue */
      this.traverseQueue();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.loopID) {
        this.getTimer().unsubscribe(this.loopID);
      } else {
        this.getTimer().stop();
      }
    }
  }, {
    key: "getTimer",
    value: function getTimer() {
      if (this.context.getTimer) {
        return this.context.getTimer();
      }
      if (!this.timer) {
        this.timer = new _timer2.default();
      }
      return this.timer;
    }
  }, {
    key: "toNewName",
    value: function toNewName(ease) {
      // d3-ease changed the naming scheme for ease from "linear" -> "easeLinear" etc.
      var capitalize = function (s) {
        return s && s[0].toUpperCase() + s.slice(1);
      };
      return "ease" + capitalize(ease);
    }

    /* Traverse the tween queue */

  }, {
    key: "traverseQueue",
    value: function traverseQueue() {
      var _this2 = this;

      if (this.queue.length) {
        /* Get the next index */
        var data = this.queue[0];
        /* compare cached version to next props */
        this.interpolator = (0, _util.victoryInterpolator)(this.state.data, data);
        /* reset step to zero */
        if (this.props.delay) {
          setTimeout(function () {
            _this2.loopID = _this2.getTimer().subscribe(_this2.functionToBeRunEachFrame, _this2.props.duration);
          }, this.props.delay);
        } else {
          this.loopID = this.getTimer().subscribe(this.functionToBeRunEachFrame, this.props.duration);
        }
      } else if (this.props.onEnd) {
        this.props.onEnd();
      }
    }
    /* every frame we... */

  }, {
    key: "functionToBeRunEachFrame",
    value: function functionToBeRunEachFrame(elapsed, duration) {
      /*
        step can generate imprecise values, sometimes greater than 1
        if this happens set the state to 1 and return, cancelling the timer
      */
      duration = duration !== undefined ? duration : this.props.duration;
      var step = duration ? elapsed / duration : 1;
      if (step >= 1) {
        this.setState({
          data: this.interpolator(1),
          animationInfo: {
            progress: 1,
            animating: false
          }
        });
        if (this.loopID) {
          this.getTimer().unsubscribe(this.loopID);
        }
        this.queue.shift();
        this.traverseQueue();
        return;
      }
      /*
        if we're not at the end of the timer, set the state by passing
        current step value that's transformed by the ease function to the
        interpolator, which is cached for performance whenever props are received
      */
      this.setState({
        data: this.interpolator(this.ease(step)),
        animationInfo: {
          progress: step,
          animating: step < 1
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      return this.props.children(this.state.data, this.state.animationInfo);
    }
  }]);

  return VictoryAnimation;
}(_react2.default.Component);

VictoryAnimation.displayName = "VictoryAnimation";
VictoryAnimation.propTypes = {
  children: _propTypes2.default.func,
  data: _propTypes2.default.oneOfType([_propTypes2.default.object, _propTypes2.default.array]),
  delay: _propTypes2.default.number,
  duration: _propTypes2.default.number,
  easing: _propTypes2.default.oneOf(["back", "backIn", "backOut", "backInOut", "bounce", "bounceIn", "bounceOut", "bounceInOut", "circle", "circleIn", "circleOut", "circleInOut", "linear", "linearIn", "linearOut", "linearInOut", "cubic", "cubicIn", "cubicOut", "cubicInOut", "elastic", "elasticIn", "elasticOut", "elasticInOut", "exp", "expIn", "expOut", "expInOut", "poly", "polyIn", "polyOut", "polyInOut", "quad", "quadIn", "quadOut", "quadInOut", "sin", "sinIn", "sinOut", "sinInOut"]),
  onEnd: _propTypes2.default.func
};
VictoryAnimation.defaultProps = {
  data: {},
  delay: 0,
  duration: 1000,
  easing: "quadInOut"
};
VictoryAnimation.contextTypes = {
  getTimer: _propTypes2.default.func
};
exports.default = VictoryAnimation;