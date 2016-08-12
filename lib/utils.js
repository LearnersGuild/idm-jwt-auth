'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JWT_ISSUER = undefined;
exports.idmGraphQLFetch = idmGraphQLFetch;
exports.jwtClaimsForUser = jwtClaimsForUser;
exports.userFromJWTClaims = userFromJWTClaims;
exports.userFromJWT = userFromJWT;
exports.cookieOptsJWT = cookieOptsJWT;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JWT_ISSUER = exports.JWT_ISSUER = 'learnersguild.org';

function idmGraphQLFetch(graphQLParams) {
  var token = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  if (!process.env.IDM_BASE_URL) {
    throw new Error('IDM_BASE_URL must be set in environment');
  }
  var options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'LearnersGuild-Skip-Update-User-Middleware': 1
    },
    body: JSON.stringify(graphQLParams)
  };
  if (token) {
    options.headers = Object.assign(options.headers, {
      Authorization: 'Bearer ' + token
    });
  }

  return (0, _isomorphicFetch2.default)(process.env.IDM_BASE_URL + '/graphql', options).then(function (resp) {
    if (!resp.ok) {
      console.error('GraphQL ERROR:', resp.statusText);
      throw new Error('GraphQL ERROR: ' + resp.statusText);
    }
    return resp.json();
  }).then(function (graphQLResponse) {
    if (graphQLResponse.errors && graphQLResponse.errors.length) {
      var allErrors = graphQLResponse.errors.map(function (err) {
        return err.message;
      }).join('\n');
      throw new Error(allErrors);
    }
    return graphQLResponse;
  });
}

function jwtClaimsForUser(user) {
  /* eslint-disable camelcase */
  var now = Math.floor(Date.now() / 1000);
  var birthdate = user.dateOfBirth && user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString().slice(0, 10) : user.dateOfBirth;
  return {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + 60 * 60 * 24, // 1 day from now
    sub: user.id,
    name: user.name,
    preferred_username: user.handle,
    email: user.email,
    emails: user.emails.join(','),
    birthdate: birthdate,
    zoneinfo: user.timezone,
    phone_number: user.phone,
    roles: user.roles.join(','),
    active: user.active
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
    roles: jwtClaims.roles.split(','),
    active: jwtClaims.active
  };
}

function userFromJWT(lgJWT) {
  var jwtClaims = _jsonwebtoken2.default.verify(lgJWT, process.env.JWT_PUBLIC_KEY, { issuer: JWT_ISSUER });
  return userFromJWTClaims(jwtClaims);
}

function cookieOptsJWT() /* req */{
  var secure = process.env.NODE_ENV === 'production';
  var domain = process.env.NODE_ENV === 'production' ? '.learnersguild.org' : '.learnersguild.dev';
  return { secure: secure, domain: domain, httpOnly: true };
}