'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.refreshUserFromIDMService = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var refreshUserFromIDMService = exports.refreshUserFromIDMService = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(req, res, next) {
    var skip, query, lgJWT, result, user, dateOfBirth;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            // if this middleware is being invoked from within this module, skip it
            // (see `idmGraphQLFetch` in `utils.js`)
            skip = req.get('LearnersGuild-Skip-Update-User-Middleware');

            if (!(req.user && !skip)) {
              _context.next = 11;
              break;
            }

            query = {
              query: '\n  query ($id: ID!) {\n    getUserById(id: $id) {\n      id\n      active\n      email\n      handle\n      name\n      emails\n      phone\n      dateOfBirth\n      timezone\n      roles\n      profileUrl\n      avatarUrl\n      authProviders {\n        githubOAuth2 {\n          accessToken\n        }\n      }\n    }\n  }\n        ',
              variables: {
                id: req.user.id
              }
            };
            lgJWT = getToken(req);
            _context.next = 7;
            return (0, _utils.idmGraphQLFetch)(query, lgJWT);

          case 7:
            result = _context.sent;
            user = result.data.getUserById;

            if (user.dateOfBirth) {
              dateOfBirth = new Date(user.dateOfBirth);

              if (!isNaN(dateOfBirth.getTime())) {
                user.dateOfBirth = dateOfBirth;
              }
            }
            req.user = user.active ? user : null;

          case 11:
            _context.next = 17;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](0);

            if (!next) {
              _context.next = 17;
              break;
            }

            return _context.abrupt('return', next(_context.t0));

          case 17:
            if (next) {
              next();
            }

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 13]]);
  }));

  return function refreshUserFromIDMService(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.addUserToRequestFromJWT = addUserToRequestFromJWT;
exports.extendJWTExpiration = extendJWTExpiration;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getToken(req) {
  var authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/;
  var authHeader = req.get('Authorization');
  if (authHeader) {
    return authHeader.match(authHeaderRegex)[1];
  } else if (req.cookies && req.cookies.lgJWT) {
    return req.cookies.lgJWT;
  }
  return null;
}

function addUserToRequestFromJWT(req, res, next) {
  if (!req.user || !req.lgJWT) {
    try {
      var lgJWT = getToken(req);
      if (lgJWT) {
        req.user = (0, _utils.userFromJWT)(lgJWT);
      }
    } catch (err) {
      if (next) {
        return next(err);
      }
    }
  }
  if (next) {
    next();
  }
}

function extendJWTExpiration(req, res, next) {
  if (process.env.JWT_PRIVATE_KEY && req.user) {
    if (req.user.active) {
      try {
        var jwtClaims = (0, _utils.jwtClaimsForUser)(req.user);
        var expires = new Date(jwtClaims.exp * 1000);
        var token = _jsonwebtoken2.default.sign(jwtClaims, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS512' });
        req.lgJWT = token;
        res.set('LearnersGuild-JWT', token);
        res.cookie('lgJWT', token, (0, _assign2.default)((0, _utils.cookieOptsJWT)(req), { expires: expires }));
      } catch (err) {
        revokeJWT(req, res);
        if (next) {
          return next(err);
        }
      }
    } else {
      revokeJWT(req, res);
    }
  }
  if (next) {
    next();
  }
}

function revokeJWT(req, res) {
  res.clearCookie('lgJWT', (0, _utils.cookieOptsJWT)(req));
  req.lgJWT = null;
}