import jwt from 'jsonwebtoken'

import {userFromJWT, jwtClaimsForUser, cookieOptsJWT, idmGraphQLFetch} from './utils'

function getToken(req) {
  const authHeaderRegex = /^Bearer\s([A-Za-z0-9+\/_\-\.]+)$/
  const authHeader = req.get('Authorization')
  if (authHeader) {
    return authHeader.match(authHeaderRegex)[1]
  } else if (req.cookies && req.cookies.lgJWT) {
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
      if (next) {
        return next(err)
      }
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
      active
      email
      handle
      name
      emails
      phone
      dateOfBirth
      timezone
      roles
      profileUrl
      avatarUrl
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

      const lgJWT = getToken(req)
      const result = await idmGraphQLFetch(query, lgJWT)
      const user = result.data.getUserById
      if (user.dateOfBirth) {
        const dateOfBirth = new Date(user.dateOfBirth)
        if (!isNaN(dateOfBirth.getTime())) {
          user.dateOfBirth = dateOfBirth
        }
      }
      req.user = user.active ? user : null
    }
  } catch (err) {
    if (next) {
      return next(err)
    }
  }
  if (next) {
    next()
  }
}

export function extendJWTExpiration(req, res, next) {
  if (process.env.JWT_PRIVATE_KEY && req.user) {
    if (req.user.active) {
      try {
        const jwtClaims = jwtClaimsForUser(req.user)
        const expires = new Date(jwtClaims.exp * 1000)
        const token = jwt.sign(jwtClaims, process.env.JWT_PRIVATE_KEY, {algorithm: 'RS512'})
        req.lgJWT = token
        res.set('LearnersGuild-JWT', token)
        res.cookie('lgJWT', token, Object.assign(cookieOptsJWT(req), {expires}))
      } catch (err) {
        revokeJWT(req, res)
        if (next) {
          return next(err)
        }
      }
    } else {
      revokeJWT(req, res)
    }
  }
  if (next) {
    next()
  }
}

function revokeJWT(req, res) {
  res.clearCookie('lgJWT', cookieOptsJWT(req))
  req.lgJWT = null
}
