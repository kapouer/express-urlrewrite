
/**
 * Module dependencies.
 */

 var debug = require('debug')('express-urlrewrite');
 var toRegexp = require('path-to-regexp');

/**
 * Expose `expose`.
 */

module.exports = rewrite;

/**
 * Rewrite `src` to `dst`.
 *
 * @param {String|RegExp} src
 * @param {String} dst
 * @return {Function}
 * @api public
 */

function rewrite(src, dst) {
  var keys = [];
  var re = toRegexp(src, keys);
  var map = toMap(keys);

  debug('rewrite %s -> %s    %s', src, dst, re);

  return function(req, res, next){
    var orig = req.url;
    var m = re.exec(orig);

    if (m) {
      req.url = dst.replace(/\$(\d+)|(?::(\w+))/g, function(_, n, name){
        if (name) return m[map[name].index + 1];
        return m[n];
      });
      debug('rewrite %s -> %s', orig, req.url);
    }

    next();
  }
}

/**
 * Turn params array into a map for quick lookup.
 *
 * @param {Array} params
 * @return {Object}
 * @api private
 */

function toMap(params) {
  var map = {};

  params.forEach(function(param, i){
    param.index = i;
    map[param.name] = param;
  });

  return map;
}
