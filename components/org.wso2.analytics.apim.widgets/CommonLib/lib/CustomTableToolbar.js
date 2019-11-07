"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactIntl = require("react-intl");

var _Toolbar = _interopRequireDefault(require("@material-ui/core/Toolbar"));

var _Typography = _interopRequireDefault(require("@material-ui/core/Typography"));

var _IconButton = _interopRequireDefault(require("@material-ui/core/IconButton"));

var _Tooltip = _interopRequireDefault(require("@material-ui/core/Tooltip"));

var _FilterList = _interopRequireDefault(require("@material-ui/icons/FilterList"));

var _TextField = _interopRequireDefault(require("@material-ui/core/TextField"));

var _MenuItem = _interopRequireDefault(require("@material-ui/core/MenuItem"));

var _Collapse = _interopRequireDefault(require("@material-ui/core/Collapse"));

var _styles = require("@material-ui/core/styles");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
var styles = function styles(theme) {
  return {
    root: {
      paddingRight: theme.spacing.unit
    },
    title: {
      position: 'absolute',
      top: 0,
      left: 0,
      marginTop: '20px',
      marginLeft: '20px'
    },
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
      width: '40%',
      marginTop: 0
    },
    menu: {
      width: 150
    },
    actions: {
      position: 'absolute',
      top: 0,
      right: 0,
      marginTop: '10px',
      marginRight: '10px'
    },
    expand: {
      marginLeft: 'auto'
    },
    collapsef: {
      display: 'flex',
      marginLeft: 'auto',
      marginRight: 0,
      marginTop: '60px'
    }
  };
};
/**
 * Create React Component for Custom Table Toolbar
 */


function CustomTableToolbar(props) {
  var classes = props.classes,
      handleExpandClick = props.handleExpandClick,
      expanded = props.expanded,
      filterColumn = props.filterColumn,
      handleColumnSelect = props.handleColumnSelect,
      handleQueryChange = props.handleQueryChange,
      query = props.query;
  return _react["default"].createElement(_Toolbar["default"], {
    className: classes.root
  }, _react["default"].createElement("div", {
    className: classes.title
  }, _react["default"].createElement(_Typography["default"], {
    variant: "h6",
    id: "tableTitle"
  })), _react["default"].createElement("div", {
    className: classes.actions
  }, _react["default"].createElement(_Tooltip["default"], {
    title: _react["default"].createElement(_reactIntl.FormattedMessage, {
      id: "filter.label.title",
      defaultMessage: "Filter By"
    })
  }, _react["default"].createElement(_IconButton["default"], {
    className: classes.expand,
    onClick: handleExpandClick,
    "aria-expanded": expanded,
    "aria-label": _react["default"].createElement(_reactIntl.FormattedMessage, {
      id: "filter.label.title",
      defaultMessage: "Filter By"
    })
  }, _react["default"].createElement(_FilterList["default"], null)))), _react["default"].createElement(_Collapse["default"], {
    "in": expanded,
    timeout: "auto",
    unmountOnExit: true,
    className: classes.collapsef
  }, _react["default"].createElement("div", null, _react["default"].createElement(_TextField["default"], {
    id: "column-select",
    select: true,
    label: _react["default"].createElement(_reactIntl.FormattedMessage, {
      id: "filter.column.menu.heading",
      defaultMessage: "Column Name"
    }),
    className: classes.textField,
    value: filterColumn,
    onChange: handleColumnSelect,
    SelectProps: {
      MenuProps: {
        className: classes.menu
      }
    },
    margin: "normal"
  }, _react["default"].createElement(_MenuItem["default"], {
    value: "creator"
  }, _react["default"].createElement(_reactIntl.FormattedMessage, {
    id: "table.heading.creator",
    defaultMessage: "CREATOR"
  })), _react["default"].createElement(_MenuItem["default"], {
    value: "subcount"
  }, _react["default"].createElement(_reactIntl.FormattedMessage, {
    id: "table.heading.subcount",
    defaultMessage: "SUB COUNT"
  }))), _react["default"].createElement(_TextField["default"], {
    id: "query-search",
    label: _react["default"].createElement(_reactIntl.FormattedMessage, {
      id: "filter.search.placeholder",
      defaultMessage: "Search Field"
    }),
    type: "search",
    value: query,
    className: classes.textField,
    onChange: handleQueryChange,
    margin: "normal"
  }))));
}

CustomTableToolbar.propTypes = {
  classes: _propTypes["default"].instanceOf(Object).isRequired,
  expanded: _propTypes["default"].string.isRequired,
  filterColumn: _propTypes["default"].string.isRequired,
  query: _propTypes["default"].string.isRequired,
  handleExpandClick: _propTypes["default"].func.isRequired,
  handleColumnSelect: _propTypes["default"].func.isRequired,
  handleQueryChange: _propTypes["default"].func.isRequired
};

var _default = (0, _styles.withStyles)(styles)(CustomTableToolbar);

exports["default"] = _default;
//# sourceMappingURL=CustomTableToolbar.js.map