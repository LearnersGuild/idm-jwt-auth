import test from 'ava'

import {jwtClaimsForUser, userFromJWTClaims} from '../utils'

const testUser = {
  id: 'aaaabbbb-cccc-dddd-eeee-ffff11112222',
  name: 'Me Example',
  handle: 'meexample',
  email: 'me@example.com',
  emails: [
    'me@example.com',
    'me2@example.com',
  ],
  dateOfBirth: new Date(Date.UTC(1980, 0, 1, 0, 0, 0, 0)),
  phone: 4159876543,
  timezone: 'America/Los_Angeles',
  roles: ['somerole', 'anotherrole'],
}

/* eslint-disable camelcase */
const testClaims = {
  sub: 'aaaabbbb-cccc-dddd-eeee-ffff11112222',
  name: 'Me Example',
  preferred_username: 'meexample',
  email: 'me@example.com',
  emails: 'me@example.com,me2@example.com',
  birthdate: '1980-01-01',
  zoneinfo: 'America/Los_Angeles',
  phone_number: 4159876543,
  roles: 'somerole,anotherrole'
}

test('jwtClaimsForUser presents correct data', t => {
  t.plan(9)
  const claims = jwtClaimsForUser(testUser)
  t.is(claims.sub, testUser.id)
  t.is(claims.name, testUser.name)
  t.is(claims.preferred_username, testUser.handle)
  t.is(claims.email, testUser.email)
  t.is(claims.emails, testUser.emails.join(','))
  t.is(claims.birthdate, testUser.dateOfBirth.toISOString().slice(0, 10))
  t.is(claims.zoneinfo, testUser.timezone)
  t.is(claims.phone_number, testUser.phone)
  t.is(claims.roles, testUser.roles.join(','))
})

test('userFromJWTClaims presents correct data', t => {
  t.plan(9)
  const user = userFromJWTClaims(testClaims)
  t.is(user.id, testClaims.sub)
  t.is(user.name, testClaims.name)
  t.is(user.handle, testClaims.preferred_username)
  t.is(user.email, testClaims.email)
  t.is(user.emails.join(','), testClaims.emails)
  t.is(user.dateOfBirth.toISOString().slice(0, 10), testClaims.birthdate)
  t.is(user.timezone, testClaims.zoneinfo)
  t.is(user.phone, testClaims.phone_number)
  t.is(user.roles.join(','), testClaims.roles)
})
