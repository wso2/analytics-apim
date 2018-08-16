'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _world = require('./world.json');

Object.defineProperty(exports, 'WorldMap', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_world).default;
  }
});

var _europe = require('./europe.json');

Object.defineProperty(exports, 'EuropeMap', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_europe).default;
  }
});

var _usa = require('./usa2.json');

Object.defineProperty(exports, 'USAMap', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_usa).default;
  }
});

var _countryInfo = require('./countryInfo.json');

Object.defineProperty(exports, 'CountryInfo', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_countryInfo).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }