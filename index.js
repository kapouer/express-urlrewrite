
/**
 * Module dependencies.
 */

const debug = require('debug')('express-urlrewrite');
const { pathToRegexp } = require('path-to-regexp');
const URL = require('url');

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
	const keys = [];
	let re, map;

	if (dst) {
		re = pathToRegexp(src, keys);
		map = toMap(keys);
		debug('rewrite %s -> %s    %s', src, dst, re);
	} else {
		debug('rewrite current route -> %s', src);
	}

	return function(req, res, next) {
		const orig = req.url;
		let m;
		if (dst) {
			m = re.exec(orig);
			if (!m) {
				return next();
			}
		}
		req.url = (dst || src).replace(/\$(\d+)|(?::(\w+))/g, (_, n, name) => {
			if (name) {
				if (m) return m[map[name].index + 1];
				else return req.params[name];
			} else if (m) {
				return m[n];
			} else {
				return req.params[n];
			}
		});
		debug('rewrite %s -> %s', orig, req.url);
		if (req.url.indexOf('?') > 0) {
			req.query = URL.parse(req.url, true).query;
			debug('rewrite updated new query', req.query);
		}
		if (dst) next();
		else next('route');
	};
}

/**
 * Turn params array into a map for quick lookup.
 *
 * @param {Array} params
 * @return {Object}
 * @api private
 */

function toMap(params) {
	const map = {};

	params.forEach((param, i) => {
		param.index = i;
		map[param.name] = param;
	});

	return map;
}
