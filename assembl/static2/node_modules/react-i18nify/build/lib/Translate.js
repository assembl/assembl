'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _I18n = require('./I18n');

var _I18n2 = _interopRequireDefault(_I18n);

var _Base = require('./Base');

var _Base2 = _interopRequireDefault(_Base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint no-underscore-dangle: "off" */

var Translate = function (_BaseComponent) {
  _inherits(Translate, _BaseComponent);

  function Translate() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Translate);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Translate.__proto__ || Object.getPrototypeOf(Translate)).call.apply(_ref, [this].concat(args))), _this), _this.otherProps = function () {
      var result = _extends({}, _this.props);
      delete result.value;
      return result;
    }, _this.render = function () {
      return _react2.default.createElement(
        'span',
        null,
        _I18n2.default._translate(_this.props.value, _this.otherProps())
      );
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  return Translate;
}(_Base2.default);

Translate.propTypes = {
  value: _react2.default.PropTypes.string.isRequired
};
exports.default = Translate;