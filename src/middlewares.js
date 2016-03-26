import jwt from 'jsonwebtoken'

import {userFromJWT, jwtClaimsForUser, cookieOptsJWT} from './utils'

export function addUserToRequestFromJWT(req, res, next) {
  if (!req.user || !req.lgJWT) {
    try {
      const authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/
      const authHeader = req.get('Authorization')
      if (authHeader) {
        console.info('Found JWT in Authorization header.')
        req.user = userFromJWT(authHeader.match(authHeaderRegex)[1])
      } else if (req.cookies && req.cookies.lgJWT) {
        console.info('Found JWT in cookie.')
        req.user = userFromJWT(req.cookies.lgJWT)
      }
    } catch (err) {
      console.info('Error getting user from JWT:', err.message ? err.message : err)
    }
  }
  if (next) {
    next()
  }
}

export function extendJWTExpiration(req, res, next) {
  if (process.env.JWT_PRIVATE_KEY && req.user) {
    try {
      const jwtClaims = jwtClaimsForUser(req.user)
      const expires = new Date(jwtClaims.exp * 1000)
      const token = jwt.sign(jwtClaims, process.env.JWT_PRIVATE_KEY, {algorithm: 'RS512'})
      req.lgJWT = token
      console.info('Extending JWT expiration.')
      res.set('LearnersGuild-JWT', token)
      res.cookie('lgJWT', token, Object.assign(cookieOptsJWT(req), {expires}))
    } catch (err) {
      console.info('Invalid JWT:', err.message ? err.message : err)
      res.clearCookie('lgJWT', cookieOptsJWT(req))
      req.lgJWT = null
    }
  }
  if (next) {
    next()
  }
}
