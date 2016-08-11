'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.refreshUserFromIDMService = undefined;

var refreshUserFromIDMService = exports.refreshUserFromIDMService = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(req, res, next) {
    var skip, query, lgJWT, result, user, dateOfBirth, msg;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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
              query: '\n  query ($id: ID!) {\n    getUserById(id: $id) {\n      id\n      active\n      email\n      handle\n      name\n      emails\n      phone\n      dateOfBirth\n      timezone\n      roles\n      authProviders {\n        githubOAuth2 {\n          accessToken\n        }\n      }\n    }\n  }\n        ',
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
            _context.next = 18;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](0);
            msg = 'ERROR updating user from IDM service:';

            console.error(msg, _context.t0.stack);
            return _context.abrupt('return', next(new Error(msg + ' ' + (_context.t0.message || _context.t0))));

          case 18:
            if (next) {
              next();
            }

          case 19:
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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function getToken(req) {
  var authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/;
  var authHeader = req.get('Authorization');
  if (authHeader) {
    // console.info('Found JWT in Authorization header.')
    return authHeader.match(authHeaderRegex)[1];
  } else if (req.cookies && req.cookies.lgJWT) {
    // console.info('Found JWT in cookie.')
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
      console.error('Error getting user from JWT:', err.message ? err.message : err);
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
        // console.info('Extending JWT expiration.')
        res.set('LearnersGuild-JWT', token);
        res.cookie('lgJWT', token, Object.assign((0, _utils.cookieOptsJWT)(req), { expires: expires }));
      } catch (err) {
        console.error('Invalid JWT:', err.message ? err.message : err);
        revokeJWT(req, res);
      }
    } else {
      console.log('Inactive User [' + req.user.id + '] (' + req.user.handle + '). Revoking JWT');
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