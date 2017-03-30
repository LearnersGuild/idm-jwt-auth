const https = require('express-sslify').HTTPS
const express = require('express')
const cookieParser = require('cookie-parser')
const { addUserToRequestFromJWT } = require('@learnersguild/idm-jwt-auth/lib/middlewares')
const { idmGraphQLFetch } = require('@learnersguild/idm-jwt-auth/lib/utils')

if ( !process.env.JWT_PUBLIC_KEY ) {
  throw new Error(`You do not have a JWT_PUBLIC_KEY in your .env. Please add it.`)
}

const server = express()
const PORT = process.env.PORT

// ensure secure connection
if (process.env.NODE_ENV === 'production') {
  server.use(https({trustProtoHeader: true}))
}

server.use(cookieParser())

server.use(addUserToRequestFromJWT)

// redirect to login if not logged in
server.use((req, res, next) => {
  if (req.user) return next()
  const redirectTo = encodeURIComponent(`${req.protocol}://${req.get('host')}${req.originalUrl}`)
  const loginURL = `${process.env.IDM_BASE_URL}/sign-in?redirect=${redirectTo}`
  res.redirect(loginURL)
})

// render your user object as json
server.get('/whoami', (req, res) => {
  res.json(req.user)
})





// this is essentially clone of the `idmGraphQLFetch` function but for game
const gameGraphQLFetch = function(graphQLParams, token = null) {
  if (!process.env.GAME_BASE_URL) {
    throw new Error('GAME_BASE_URL must be set in environment')
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

  return fetch(`${process.env.GAME_BASE_URL}/graphql`, options)
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


server.use((req, res, next) => {
  req.queryIdm = function(query, variables={}){
    return idmGraphQLFetch({query, variables}, req.cookies.lgJWT)
  }
  req.queryGame = function(query, variables={}){
    return gameGraphQLFetch({query, variables}, req.cookies.lgJWT)
  }
  next()
})


// The homepage lists all users in IDM as json
server.get('/', (req, res) => {
  const query =
  req.queryIdm(`
    query {
      findUsers {
        name
        handle
        avatarUrl
        email
        active
      }
    }
  `)
  .then(results => {
    const players = results.data.findUsers
    res.json({players})
  })
  .catch(error => {
    res.status(500).render('error', {error})
  })
})


server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
