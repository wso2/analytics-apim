'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

exports.default = function (Base) {
  return function (_Base) {
    _inherits(_class, _Base);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
    }

    _createClass(_class, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        this.setStateWithData(this.getDataModel(this.getResolvedState(), true));
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.fireFetchData();
      }
    }, {
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps(nextProps, nextState) {
        var oldState = this.getResolvedState();
        var newState = this.getResolvedState(nextProps, nextState);

        // Do a deep compare of new and old `defaultOption` and
        // if they are different reset `option = defaultOption`
        var defaultableOptions = ['sorted', 'filtered', 'resized', 'expanded'];
        defaultableOptions.forEach(function (x) {
          var defaultName = 'default' + (x.charAt(0).toUpperCase() + x.slice(1));
          if (JSON.stringify(oldState[defaultName]) !== JSON.stringify(newState[defaultName])) {
            newState[x] = newState[defaultName];
          }
        });

        // If they change these table options, we need to reset defaults
        // or else we could get into a state where the user has changed the UI
        // and then disabled the ability to change it back.
        // e.g. If `filterable` has changed, set `filtered = defaultFiltered`
        var resettableOptions = ['sortable', 'filterable', 'resizable'];
        resettableOptions.forEach(function (x) {
          if (oldState[x] !== newState[x]) {
            var baseName = x.replace('able', '');
            var optionName = baseName + 'ed';
            var defaultName = 'default' + (optionName.charAt(0).toUpperCase() + optionName.slice(1));
            newState[optionName] = newState[defaultName];
          }
        });

        // Props that trigger a data update
        if (oldState.data !== newState.data || oldState.columns !== newState.columns || oldState.pivotBy !== newState.pivotBy || oldState.sorted !== newState.sorted || oldState.filtered !== newState.filtered) {
          this.setStateWithData(this.getDataModel(newState, oldState.data !== newState.data));
        }
      }
    }, {
      key: 'setStateWithData',
      value: function setStateWithData(newState, cb) {
        var _this2 = this;

        var oldState = this.getResolvedState();
        var newResolvedState = this.getResolvedState({}, newState);
        var freezeWhenExpanded = newResolvedState.freezeWhenExpanded;

        // Default to unfrozen state

        newResolvedState.frozen = false;

        // If freezeWhenExpanded is set, check for frozen conditions
        if (freezeWhenExpanded) {
          // if any rows are expanded, freeze the existing data and sorting
          var keys = Object.keys(newResolvedState.expanded);
          for (var i = 0; i < keys.length; i += 1) {
            if (newResolvedState.expanded[keys[i]]) {
              newResolvedState.frozen = true;
              break;
            }
          }
        }

        // If the data isn't frozen and either the data or
        // sorting model has changed, update the data
        if (oldState.frozen && !newResolvedState.frozen || oldState.sorted !== newResolvedState.sorted || oldState.filtered !== newResolvedState.filtered || oldState.showFilters !== newResolvedState.showFilters || !newResolvedState.frozen && oldState.resolvedData !== newResolvedState.resolvedData) {
          // Handle collapseOnsortedChange & collapseOnDataChange
          if (oldState.sorted !== newResolvedState.sorted && this.props.collapseOnSortingChange || oldState.filtered !== newResolvedState.filtered || oldState.showFilters !== newResolvedState.showFilters || oldState.sortedData && !newResolvedState.frozen && oldState.resolvedData !== newResolvedState.resolvedData && this.props.collapseOnDataChange) {
            newResolvedState.expanded = {};
          }

          Object.assign(newResolvedState, this.getSortedData(newResolvedState));
        }

        // Set page to 0 if filters change
        if (oldState.filtered !== newResolvedState.filtered) {
          newResolvedState.page = 0;
        }

        // Calculate pageSize all the time
        if (newResolvedState.sortedData) {
          newResolvedState.pages = newResolvedState.manual ? newResolvedState.pages : Math.ceil(newResolvedState.sortedData.length / newResolvedState.pageSize);
          newResolvedState.page = Math.max(newResolvedState.page >= newResolvedState.pages ? newResolvedState.pages - 1 : newResolvedState.page, 0);
        }

        return this.setState(newResolvedState, function () {
          if (cb) {
            cb();
          }
          if (oldState.page !== newResolvedState.page || oldState.pageSize !== newResolvedState.pageSize || oldState.sorted !== newResolvedState.sorted || oldState.filtered !== newResolvedState.filtered) {
            _this2.fireFetchData();
          }
        });
      }
    }]);

    return _class;
  }(Base);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9saWZlY3ljbGUuanMiXSwibmFtZXMiOlsic2V0U3RhdGVXaXRoRGF0YSIsImdldERhdGFNb2RlbCIsImdldFJlc29sdmVkU3RhdGUiLCJmaXJlRmV0Y2hEYXRhIiwibmV4dFByb3BzIiwibmV4dFN0YXRlIiwib2xkU3RhdGUiLCJuZXdTdGF0ZSIsImRlZmF1bHRhYmxlT3B0aW9ucyIsImZvckVhY2giLCJkZWZhdWx0TmFtZSIsIngiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiSlNPTiIsInN0cmluZ2lmeSIsInJlc2V0dGFibGVPcHRpb25zIiwiYmFzZU5hbWUiLCJyZXBsYWNlIiwib3B0aW9uTmFtZSIsImRhdGEiLCJjb2x1bW5zIiwicGl2b3RCeSIsInNvcnRlZCIsImZpbHRlcmVkIiwiY2IiLCJuZXdSZXNvbHZlZFN0YXRlIiwiZnJlZXplV2hlbkV4cGFuZGVkIiwiZnJvemVuIiwia2V5cyIsIk9iamVjdCIsImV4cGFuZGVkIiwiaSIsImxlbmd0aCIsInNob3dGaWx0ZXJzIiwicmVzb2x2ZWREYXRhIiwicHJvcHMiLCJjb2xsYXBzZU9uU29ydGluZ0NoYW5nZSIsInNvcnRlZERhdGEiLCJjb2xsYXBzZU9uRGF0YUNoYW5nZSIsImFzc2lnbiIsImdldFNvcnRlZERhdGEiLCJwYWdlIiwicGFnZXMiLCJtYW51YWwiLCJNYXRoIiwiY2VpbCIsInBhZ2VTaXplIiwibWF4Iiwic2V0U3RhdGUiLCJCYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztrQkFBZTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSwyQ0FFVztBQUNwQixhQUFLQSxnQkFBTCxDQUFzQixLQUFLQyxZQUFMLENBQWtCLEtBQUtDLGdCQUFMLEVBQWxCLEVBQTJDLElBQTNDLENBQXRCO0FBQ0Q7QUFKVTtBQUFBO0FBQUEsMENBTVU7QUFDbkIsYUFBS0MsYUFBTDtBQUNEO0FBUlU7QUFBQTtBQUFBLGdEQVVnQkMsU0FW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aUJpQixLQUExQyxHQUNJakIsaUJBQWlCaUIsS0FBakIsR0FBeUIsQ0FEN0IsR0FFSWpCLGlCQUFpQmdCLElBSEMsRUFJdEIsQ0FKc0IsQ0FBeEI7QUFNRDs7QUFFRCxlQUFPLEtBQUtPLFFBQUwsQ0FBY3ZCLGdCQUFkLEVBQWdDLFlBQU07QUFDM0MsY0FBSUQsRUFBSixFQUFRO0FBQ05BO0FBQ0Q7QUFDRCxjQUNFcEIsU0FBU3FDLElBQVQsS0FBa0JoQixpQkFBaUJnQixJQUFuQyxJQUNBckMsU0FBUzBDLFFBQVQsS0FBc0JyQixpQkFBaUJxQixRQUR2QyxJQUVBMUMsU0FBU2tCLE1BQVQsS0FBb0JHLGlCQUFpQkgsTUFGckMsSUFHQWxCLFNBQVNtQixRQUFULEtBQXNCRSxpQkFBaUJGLFFBSnpDLEVBS0U7QUFDQSxtQkFBS3RCLGFBQUw7QUFDRDtBQUNGLFNBWk0sQ0FBUDtBQWFEO0FBOUhVOztBQUFBO0FBQUEsSUFDQ2dELElBREQ7QUFBQSxDIiwiZmlsZSI6ImxpZmVjeWNsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IEJhc2UgPT5cbiAgY2xhc3MgZXh0ZW5kcyBCYXNlIHtcbiAgICBjb21wb25lbnRXaWxsTW91bnQgKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZVdpdGhEYXRhKHRoaXMuZ2V0RGF0YU1vZGVsKHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSgpLCB0cnVlKSlcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCAoKSB7XG4gICAgICB0aGlzLmZpcmVGZXRjaERhdGEoKVxuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMgKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSgpXG4gICAgICBjb25zdCBuZXdTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSlcblxuICAgICAgLy8gRG8gYSBkZWVwIGNvbXBhcmUgb2YgbmV3IGFuZCBvbGQgYGRlZmF1bHRPcHRpb25gIGFuZFxuICAgICAgLy8gaWYgdGhleSBhcmUgZGlmZmVyZW50IHJlc2V0IGBvcHRpb24gPSBkZWZhdWx0T3B0aW9uYFxuICAgICAgY29uc3QgZGVmYXVsdGFibGVPcHRpb25zID0gWydzb3J0ZWQnLCAnZmlsdGVyZWQnLCAncmVzaXplZCcsICdleHBhbmRlZCddXG4gICAgICBkZWZhdWx0YWJsZU9wdGlvbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgY29uc3QgZGVmYXVsdE5hbWUgPSBgZGVmYXVsdCR7eC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHguc2xpY2UoMSl9YFxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkob2xkU3RhdGVbZGVmYXVsdE5hbWVdKSAhPT0gSlNPTi5zdHJpbmdpZnkobmV3U3RhdGVbZGVmYXVsdE5hbWVdKSkge1xuICAgICAgICAgIG5ld1N0YXRlW3hdID0gbmV3U3RhdGVbZGVmYXVsdE5hbWVdXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIElmIHRoZXkgY2hhbmdlIHRoZXNlIHRhYmxlIG9wdGlvbnMsIHdlIG5lZWQgdG8gcmVzZXQgZGVmYXVsdHNcbiAgICAgIC8vIG9yIGVsc2Ugd2UgY291bGQgZ2V0IGludG8gYSBzdGF0ZSB3aGVyZSB0aGUgdXNlciBoYXMgY2hhbmdlZCB0aGUgVUlcbiAgICAgIC8vIGFuZCB0aGVuIGRpc2FibGVkIHRoZSBhYmlsaXR5IHRvIGNoYW5nZSBpdCBiYWNrLlxuICAgICAgLy8gZS5nLiBJZiBgZmlsdGVyYWJsZWAgaGFzIGNoYW5nZWQsIHNldCBgZmlsdGVyZWQgPSBkZWZhdWx0RmlsdGVyZWRgXG4gICAgICBjb25zdCByZXNldHRhYmxlT3B0aW9ucyA9IFsnc29ydGFibGUnLCAnZmlsdGVyYWJsZScsICdyZXNpemFibGUnXVxuICAgICAgcmVzZXR0YWJsZU9wdGlvbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgaWYgKG9sZFN0YXRlW3hdICE9PSBuZXdTdGF0ZVt4XSkge1xuICAgICAgICAgIGNvbnN0IGJhc2VOYW1lID0geC5yZXBsYWNlKCdhYmxlJywgJycpXG4gICAgICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IGAke2Jhc2VOYW1lfWVkYFxuICAgICAgICAgIGNvbnN0IGRlZmF1bHROYW1lID0gYGRlZmF1bHQke29wdGlvbk5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBvcHRpb25OYW1lLnNsaWNlKDEpfWBcbiAgICAgICAgICBuZXdTdGF0ZVtvcHRpb25OYW1lXSA9IG5ld1N0YXRlW2RlZmF1bHROYW1lXVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBQcm9wcyB0aGF0IHRyaWdnZXIgYSBkYXRhIHVwZGF0ZVxuICAgICAgaWYgKFxuICAgICAgICBvbGRTdGF0ZS5kYXRhICE9PSBuZXdTdGF0ZS5kYXRhIHx8XG4gICAgICAgIG9sZFN0YXRlLmNvbHVtbnMgIT09IG5ld1N0YXRlLmNvbHVtbnMgfHxcbiAgICAgICAgb2xkU3RhdGUucGl2b3RCeSAhPT0gbmV3U3RhdGUucGl2b3RCeSB8fFxuICAgICAgICBvbGRTdGF0ZS5zb3J0ZWQgIT09IG5ld1N0YXRlLnNvcnRlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3U3RhdGUuZmlsdGVyZWRcbiAgICAgICkge1xuICAgICAgICB0aGlzLnNldFN0YXRlV2l0aERhdGEodGhpcy5nZXREYXRhTW9kZWwobmV3U3RhdGUsIG9sZFN0YXRlLmRhdGEgIT09IG5ld1N0YXRlLmRhdGEpKVxuICAgICAgfVxuICAgIH1cblxuICAgIHNldFN0YXRlV2l0aERhdGEgKG5ld1N0YXRlLCBjYikge1xuICAgICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLmdldFJlc29sdmVkU3RhdGUoKVxuICAgICAgY29uc3QgbmV3UmVzb2x2ZWRTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSh7fSwgbmV3U3RhdGUpXG4gICAgICBjb25zdCB7IGZyZWV6ZVdoZW5FeHBhbmRlZCB9ID0gbmV3UmVzb2x2ZWRTdGF0ZVxuXG4gICAgICAvLyBEZWZhdWx0IHRvIHVuZnJvemVuIHN0YXRlXG4gICAgICBuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiA9IGZhbHNlXG5cbiAgICAgIC8vIElmIGZyZWV6ZVdoZW5FeHBhbmRlZCBpcyBzZXQsIGNoZWNrIGZvciBmcm96ZW4gY29uZGl0aW9uc1xuICAgICAgaWYgKGZyZWV6ZVdoZW5FeHBhbmRlZCkge1xuICAgICAgICAvLyBpZiBhbnkgcm93cyBhcmUgZXhwYW5kZWQsIGZyZWV6ZSB0aGUgZXhpc3RpbmcgZGF0YSBhbmQgc29ydGluZ1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMobmV3UmVzb2x2ZWRTdGF0ZS5leHBhbmRlZClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgaWYgKG5ld1Jlc29sdmVkU3RhdGUuZXhwYW5kZWRba2V5c1tpXV0pIHtcbiAgICAgICAgICAgIG5ld1Jlc29sdmVkU3RhdGUuZnJvemVuID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGRhdGEgaXNuJ3QgZnJvemVuIGFuZCBlaXRoZXIgdGhlIGRhdGEgb3JcbiAgICAgIC8vIHNvcnRpbmcgbW9kZWwgaGFzIGNoYW5nZWQsIHVwZGF0ZSB0aGUgZGF0YVxuICAgICAgaWYgKFxuICAgICAgICAob2xkU3RhdGUuZnJvemVuICYmICFuZXdSZXNvbHZlZFN0YXRlLmZyb3plbikgfHxcbiAgICAgICAgb2xkU3RhdGUuc29ydGVkICE9PSBuZXdSZXNvbHZlZFN0YXRlLnNvcnRlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5zaG93RmlsdGVycyAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zaG93RmlsdGVycyB8fFxuICAgICAgICAoIW5ld1Jlc29sdmVkU3RhdGUuZnJvemVuICYmIG9sZFN0YXRlLnJlc29sdmVkRGF0YSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5yZXNvbHZlZERhdGEpXG4gICAgICApIHtcbiAgICAgICAgLy8gSGFuZGxlIGNvbGxhcHNlT25zb3J0ZWRDaGFuZ2UgJiBjb2xsYXBzZU9uRGF0YUNoYW5nZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKG9sZFN0YXRlLnNvcnRlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zb3J0ZWQgJiYgdGhpcy5wcm9wcy5jb2xsYXBzZU9uU29ydGluZ0NoYW5nZSkgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZCB8fFxuICAgICAgICAgIG9sZFN0YXRlLnNob3dGaWx0ZXJzICE9PSBuZXdSZXNvbHZlZFN0YXRlLnNob3dGaWx0ZXJzIHx8XG4gICAgICAgICAgKG9sZFN0YXRlLnNvcnRlZERhdGEgJiZcbiAgICAgICAgICAgICFuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiAmJlxuICAgICAgICAgICAgb2xkU3RhdGUucmVzb2x2ZWREYXRhICE9PSBuZXdSZXNvbHZlZFN0YXRlLnJlc29sdmVkRGF0YSAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jb2xsYXBzZU9uRGF0YUNoYW5nZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5leHBhbmRlZCA9IHt9XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuYXNzaWduKG5ld1Jlc29sdmVkU3RhdGUsIHRoaXMuZ2V0U29ydGVkRGF0YShuZXdSZXNvbHZlZFN0YXRlKSlcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHBhZ2UgdG8gMCBpZiBmaWx0ZXJzIGNoYW5nZVxuICAgICAgaWYgKG9sZFN0YXRlLmZpbHRlcmVkICE9PSBuZXdSZXNvbHZlZFN0YXRlLmZpbHRlcmVkKSB7XG4gICAgICAgIG5ld1Jlc29sdmVkU3RhdGUucGFnZSA9IDBcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsY3VsYXRlIHBhZ2VTaXplIGFsbCB0aGUgdGltZVxuICAgICAgaWYgKG5ld1Jlc29sdmVkU3RhdGUuc29ydGVkRGF0YSkge1xuICAgICAgICBuZXdSZXNvbHZlZFN0YXRlLnBhZ2VzID0gbmV3UmVzb2x2ZWRTdGF0ZS5tYW51YWxcbiAgICAgICAgICA/IG5ld1Jlc29sdmVkU3RhdGUucGFnZXNcbiAgICAgICAgICA6IE1hdGguY2VpbChuZXdSZXNvbHZlZFN0YXRlLnNvcnRlZERhdGEubGVuZ3RoIC8gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlU2l6ZSlcbiAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlID0gTWF0aC5tYXgoXG4gICAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlID49IG5ld1Jlc29sdmVkU3RhdGUucGFnZXNcbiAgICAgICAgICAgID8gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlcyAtIDFcbiAgICAgICAgICAgIDogbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlLFxuICAgICAgICAgIDBcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZShuZXdSZXNvbHZlZFN0YXRlLCAoKSA9PiB7XG4gICAgICAgIGlmIChjYikge1xuICAgICAgICAgIGNiKClcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgb2xkU3RhdGUucGFnZSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlIHx8XG4gICAgICAgICAgb2xkU3RhdGUucGFnZVNpemUgIT09IG5ld1Jlc29sdmVkU3RhdGUucGFnZVNpemUgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5zb3J0ZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuc29ydGVkIHx8XG4gICAgICAgICAgb2xkU3RhdGUuZmlsdGVyZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuZmlsdGVyZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5maXJlRmV0Y2hEYXRhKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cbiJdfQ==