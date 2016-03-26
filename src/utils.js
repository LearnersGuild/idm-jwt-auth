import jwt from 'jsonwebtoken'

export const JWT_ISSUER = 'learnersguild.org'

export function jwtClaimsForUser(user) {
  /* eslint-disable camelcase */
  const now = Math.floor(Date.now() / 1000)
  return {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + (60 * 60 * 24),  // 1 day from now
    sub: user.id,
    name: user.name,
    preferred_username: user.handle,
    email: user.email,
    emails: user.emails.join(','),
    birthdate: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : undefined,
    zoneinfo: user.timezone,
    phone_number: user.phone,
    roles: user.roles.join(','),
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
  }
}

export function userFromJWT(lgJWT) {
  const jwtClaims = jwt.verify(lgJWT, process.env.JWT_PUBLIC_KEY, {issuer: JWT_ISSUER})
  return userFromJWTClaims(jwtClaims)
}

export function cookieOptsJWT(req) {
  const secure = (process.env.NODE_ENV === 'production')
  const domain = (process.env.NODE_ENV === 'production') ? '.learnersguild.org' : req.hostname
  return {secure, domain, httpOnly: true}
}
