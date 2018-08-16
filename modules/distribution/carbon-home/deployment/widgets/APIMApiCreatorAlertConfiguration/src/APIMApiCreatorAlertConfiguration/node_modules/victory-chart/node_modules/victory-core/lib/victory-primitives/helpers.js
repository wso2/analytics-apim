Object.defineProperty(exports, "__esModule", {
  value: true
});
var defined = function (d) {
  var y = d._y1 !== undefined ? d._y1 : d._y;
  return y !== null && y !== undefined && d._y0 !== null;
};

var getXAccessor = function (scale) {
  return function (d) {
    return scale.x(d._x1 !== undefined ? d._x1 : d._x);
  };
};

var getYAccessor = function (scale) {
  return function (d) {
    return scale.y(d._y1 !== undefined ? d._y1 : d._y);
  };
};

var getY0Accessor = function (scale) {
  return function (d) {
    return scale.y(d._y0);
  };
};

var getAngleAccessor = function (scale) {
  return function (d) {
    var x = scale.x(d._x1 !== undefined ? d._x1 : d._x);
    return -1 * x + Math.PI / 2;
  };
};

exports.defined = defined;
exports.getXAccessor = getXAccessor;
exports.getYAccessor = getYAccessor;
exports.getY0Accessor = getY0Accessor;
exports.getAngleAccessor = getAngleAccessor;