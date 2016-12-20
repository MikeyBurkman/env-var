'use strict';

var VError = require('verror');

module.exports = function environmentVariable (name, value) {

  var variable = {
    required: function required () {
      if (!value) {
        // Value is not set, but is required. Throw an error
        throw new VError('env-var: "%s" is required, but was not set', name);
      }

      return variable;
    },
    asInt: function asInt () {
      var n = parseInt(value, 10);

      if (isNaN(n) || n.toString().indexOf('.') !== -1) {
        throw new VError(
          'env-var: %s should be a valid integer, but was %s',
          name,
          value
        );
      }

      return n;
    },
    asPositiveInt: function asPositiveInt () {
      var ret = variable.asInt(value);

      if (ret < 0) {
        throw new VError(
          'env-var: %s should be a positive integer, but was %s',
          name,
          value
        );
      }

      return ret;
    },
    asNegativeInt: function asNegativeInt () {
      var ret = variable.asInt(value);

      if (ret >= 0) {
        throw new VError(
          'env-var: %s should be a negative integer, but was %s',
          name,
          value
        );
      }

      return ret;
    },
    asFloat: function asFloat () {
      var n = parseFloat(value);

      if (isNaN(n)) {
        throw new VError(
          'env-var: %s should be a valid float, but was %s',
          name,
          value
        );
      }

      return n;
    },
    asString: function asString () {
      return value;
    },
    asBool: function asBool () {
      var val = value.toLowerCase();
      var allowedValues = [
        'false',
        '0',
        'true',
        '1'
      ];
      if (-1 === allowedValues.indexOf(val)) {
        throw new VError(
          'env-var: "%s" should be either "true", "false", "TRUE", "FALSE", 1, or 0, but was %s',
          name,
          value
        );
      }
      return (('0' === val) || ('false' === val)) ? false : true;
    },
    asStrictBool: function asStrictBool () {
      var val = value.toLowerCase();
      if (('false' !== val) && ('true' !== val)) {
        throw new VError(
          'env-var: "%s" should be either "true", "false", "TRUE", or "FALSE" but was %s',
          name,
          value
        );
      }
      return ('false' === val) ? false : true;
    },
    asJson: function asJson () {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new VError('env-var: failed to parse "%s" to JSON', name);
      }
    },
    asJsonArray: function () {
      var ret = variable.asJson();

      if (!Array.isArray(ret)) {
        throw new VError('env-var: value for "%s was not a JSON Array', name);
      }

      return ret;
    },
    asJsonObject: function () {
      var ret = variable.asJson();

      if (Array.isArray(ret)) {
        throw new VError(
          'env-var: value for "%s was a JSON Array, but we expected Object',
          name
        );
      }

      return ret;
    },
    asArray: function (delimeter) {
      delimeter = delimeter || ',';

      return value.split(delimeter);
    }
  };

  // Wrap each function to allow it to return undefined
  [
    'asInt',
    'asPositiveInt',
    'asNegativeInt',
    'asFloat',
    'asString',
    'asBool',
    'asJson',
    'asJsonArray',
    'asJsonObject',
    'asArray',
  ].forEach(function allowUndefined (fnname) {
    // Original function
    var fn = variable[fnname];

    // Our wrapper to support non-required values
    variable[fnname] = function parseVarIfDefined () {
      if (value === undefined) {
        return value;
      } else {
        return fn.apply(fn, Array.prototype.slice.call(arguments));
      }
    };
  });

  return variable;
};
