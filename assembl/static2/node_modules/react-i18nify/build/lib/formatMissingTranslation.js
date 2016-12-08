'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatMissingTranslation;
function formatMissingTranslation(text) {
  var keys = text.split('.');
  return keys[keys.length - 1].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[A-Z]/g, function (str) {
    return str.toLowerCase();
  }).replace(/_/g, ' ').replace(/\b./g, function (str) {
    return str.toUpperCase();
  });
}