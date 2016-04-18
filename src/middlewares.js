import jwt from 'jsonwebtoken'

import {userFromJWT, jwtClaimsForUser, cookieOptsJWT, idmGraphQLFetch} from './utils'

function getToken(req) {
  const authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/
  const authHeader = req.get('Authorization')
  if (authHeader) {
    // console.info('Found JWT in Authorization header.')
    return authHeader.match(authHeaderRegex)[1]
  } else if (req.cookies && req.cookies.lgJWT) {
    // console.info('Found JWT in cookie.')
    return req.cookies.lgJWT
  }
  return null
}

export function addUserToRequestFromJWT(req, res, next) {
  if (!req.user || !req.lgJWT) {
    try {
      const lgJWT = getToken(req)
      if (lgJWT) {
        req.user = userFromJWT(lgJWT)
      }
    } catch (err) {
      console.error('Error getting user from JWT:', err.message ? err.message : err)
    }
  }
  if (next) {
    next()
  }
}

export async function refreshUserFromIDMService(req, res, next) {
  try {
    // if this middleware is being invoked from within this module, skip it
    // (see `idmGraphQLFetch` in `utils.js`)
    const skip = req.get('LearnersGuild-Skip-Update-User-Middleware')
    if (req.user && !skip) {
      const query = {
        query: `
  query ($id: ID!) {
    getUserById(id: $id) {
      id
      email
      handle
      name
      emails
      phone
      dateOfBirth
      timezone
      roles
      authProviders {
        githubOAuth2 {
          accessToken
        }
      }
    }
  }
        `,
        variables: {
          id: req.user.id,
        },
      }

      // console.log('Updating user from IDM service')
      const lgJWT = getToken(req)
      const result = await idmGraphQLFetch(query, lgJWT)
      const user = result.data.getUserById
      if (user.dateOfBirth) {
        const dateOfBirth = new Date(user.dateOfBirth)
        if (!isNaN(dateOfBirth.getTime())) {
          user.dateOfBirth = dateOfBirth
        }
      }
      req.user = user
    }
  } catch (err) {
    console.error('ERROR updating user from IDM service:', err.stack)
    return res.status(500).send(err)
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
      // console.info('Extending JWT expiration.')
      res.set('LearnersGuild-JWT', token)
      res.cookie('lgJWT', token, Object.assign(cookieOptsJWT(req), {expires}))
    } catch (err) {
      console.error('Invalid JWT:', err.message ? err.message : err)
      res.clearCookie('lgJWT', cookieOptsJWT(req))
      req.lgJWT = null
    }
  }
  if (next) {
    next()
  }
}
