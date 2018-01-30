import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-fetch'

export const JWT_ISSUER = 'learnersguild.org'

export function idmGraphQLFetch(graphQLParams, token = null) {
  if (!process.env.IDM_BASE_URL) {
    throw new Error('IDM_BASE_URL must be set in environment')
  }
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'LearnersGuild-Skip-Update-User-Middleware': 1,
    },
    body: JSON.stringify(graphQLParams),
  }
  if (token) {
    options.headers = Object.assign(options.headers, {
      Authorization: `Bearer ${token}`,
    })
  }

  return fetch(`${process.env.IDM_BASE_URL}/graphql`, options)
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`GraphQL ERROR: ${resp.statusText}`)
      }
      return resp.json()
    })
    .then(graphQLResponse => {
      if (graphQLResponse.errors && graphQLResponse.errors.length) {
        const allErrors = graphQLResponse.errors.map(err => {
          return err.message
        }).join('\n')
        throw new Error(allErrors)
      }
      return graphQLResponse
    })
}

export function jwtClaimsForUser(user) {
  /* eslint-disable camelcase */
  const now = Math.floor(Date.now() / 1000)
  const birthdate = (user.dateOfBirth && user.dateOfBirth instanceof Date) ? user.dateOfBirth.toISOString().slice(0, 10) : user.dateOfBirth
  return {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + (60 * 60 * 24),  // 1 day from now
    sub: user.id,
    name: user.name,
    preferred_username: user.handle,
    email: user.email,
    emails: user.emails.join(','),
    birthdate,
    zoneinfo: user.timezone,
    phone_number: user.phone,
    roles: user.roles.join(','),
    active: user.active,
  }
}

export function userFromJWTClaims(jwtClaims) {
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
    active: jwtClaims.active,
  }
}

export function userFromJWT(lgJWT) {
  const jwtClaims = jwt.verify(lgJWT, process.env.JWT_PUBLIC_KEY, {issuer: JWT_ISSUER})
  return userFromJWTClaims(jwtClaims)
}

export function cookieOptsJWT(/* req */) {
  const secure = (process.env.NODE_ENV === 'production')
  const domain = process.env.IDM_BASE_URL.match(/\.[^.]+\.(org|com|dev|meh)$/)[0]
  return {secure, domain, httpOnly: true}
}
