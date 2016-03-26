'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addUserToRequestFromJWT = addUserToRequestFromJWT;
exports.extendJWTExpiration = extendJWTExpiration;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addUserToRequestFromJWT(req, res, next) {
  if (!req.user || !req.lgJWT) {
    try {
      var authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/;
      var authHeader = req.get('Authorization');
      if (authHeader) {
        console.info('Found JWT in Authorization header.');
        req.user = (0, _utils.userFromJWT)(authHeader.match(authHeaderRegex)[1]);
      } else if (req.cookies && req.cookies.lgJWT) {
        console.info('Found JWT in cookie.');
        req.user = (0, _utils.userFromJWT)(req.cookies.lgJWT);
      }
    } catch (err) {
      console.info('Error getting user from JWT:', err.message ? err.message : err);
    }
  }
  if (next) {
    next();
  }
}

function extendJWTExpiration(req, res, next) {
  if (process.env.JWT_PRIVATE_KEY && req.user) {
    try {
      var jwtClaims = (0, _utils.jwtClaimsForUser)(req.user);
      var expires = new Date(jwtClaims.exp * 1000);
      var token = _jsonwebtoken2.default.sign(jwtClaims, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS512' });
      req.lgJWT = token;
      console.info('Extending JWT expiration.');
      res.set('LearnersGuild-JWT', token);
      res.cookie('lgJWT', token, Object.assign((0, _utils.cookieOptsJWT)(req), { expires: expires }));
    } catch (err) {
      console.info('Invalid JWT:', err.message ? err.message : err);
      res.clearCookie('lgJWT', (0, _utils.cookieOptsJWT)(req));
      req.lgJWT = null;
    }
  }
  if (next) {
    next();
  }
}