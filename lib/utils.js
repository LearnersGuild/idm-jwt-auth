'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JWT_ISSUER = undefined;
exports.jwtClaimsForUser = jwtClaimsForUser;
exports.userFromJWTClaims = userFromJWTClaims;
exports.userFromJWT = userFromJWT;
exports.cookieOptsJWT = cookieOptsJWT;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JWT_ISSUER = exports.JWT_ISSUER = 'learnersguild.org';

function jwtClaimsForUser(user) {
  /* eslint-disable camelcase */
  var now = Math.floor(Date.now() / 1000);
  return {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + 60 * 60 * 24, // 1 day from now
    sub: user.id,
    name: user.name,
    preferred_username: user.handle,
    email: user.email,
    emails: user.emails.join(','),
    birthdate: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : undefined,
    zoneinfo: user.timezone,
    phone_number: user.phone,
    roles: user.roles.join(',')
  };
}

function userFromJWTClaims(jwtClaims) {
  return {
    id: jwtClaims.sub,
    name: jwtClaims.name,
    handle: jwtClaims.preferred_username,
    email: jwtClaims.email,
    emails: jwtClaims.emails.split(','),
    dateOfBirth: jwtClaims.birthdate ? new Date(jwtClaims.birthdate) : undefined,
    timezone: jwtClaims.zoneinfo,
    phone: jwtClaims.phone_number,
    roles: jwtClaims.roles.split(',')
  };
}

function userFromJWT(lgJWT) {
  var jwtClaims = _jsonwebtoken2.default.verify(lgJWT, process.env.JWT_PUBLIC_KEY, { issuer: JWT_ISSUER });
  return userFromJWTClaims(jwtClaims);
}

function cookieOptsJWT(req) {
  var secure = process.env.NODE_ENV === 'production';
  var domain = process.env.NODE_ENV === 'production' ? '.learnersguild.org' : req.hostname;
  return { secure: secure, domain: domain, httpOnly: true };
}