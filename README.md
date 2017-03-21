# idm-jwt-auth

[![Code Climate GPA](https://codeclimate.com/repos/579a595fecc56b007d001cac/badges/21d27f854475ab0b51d0/gpa.svg)](https://codeclimate.com/repos/579a595fecc56b007d001cac/feed)
[![Code Climate Issue Count](https://codeclimate.com/repos/579a595fecc56b007d001cac/badges/21d27f854475ab0b51d0/issue_count.svg)](https://codeclimate.com/repos/579a595fecc56b007d001cac/feed)
[![Test Coverage](https://codeclimate.com/repos/579a595fecc56b007d001cac/badges/21d27f854475ab0b51d0/coverage.svg)](https://codeclimate.com/repos/579a595fecc56b007d001cac/coverage)

Utilities for implementing JWT authentication against the Learners Guild IDM server on Node.js.


## Getting Started

Read the [instructions for contributing](./CONTRIBUTING.md).

1. Clone the repository.

2. Run the setup tasks:

```sh
npm install
npm run test
```


## How to Use

__Step 1__ Install the module in your project

```sh
npm install --save @learnersguild/idm-jwt-auth
```

__Step 2__ Ensure you have a cookie parser

```js
const cookieParser = require('cookie-parser')
app.use(cookieParser())
```

__Step 3__ Add the `addUserToRequestFromJWT` middleware to decode the user into `request.user`

```js
const { addUserToRequestFromJWT } = require('@learnersguild/idm-jwt-auth/lib/middlewares')
app.use(addUserToRequestFromJWT)
// user should now be available at request.user
```

__Step 4__ If you need to refresh a user's session

```js
const { refreshUserFromIDMService } = require('@learnersguild/idm-jwt-auth/lib/middlewares')
app.use((req, res, next) => {
  refreshUserFromIDMService(req, res, err => {
    if (err) {
      // this is not enough to break things -- if we are unable to refresh the
      // user from IDM, but our JWT is still valid, it's okay, so we won't
      // allow this error to propagate beyond this point
      console.warn('WARNING: unable to refresh user from IDM service:', err)
    }
    next()
  })
})
```

__Step 5__ If you need to extend a user's session

```js
const { extendJWTExpiration } = require('@learnersguild/idm-jwt-auth/lib/middlewares')
app.user(extendJWTExpiration)
```


## Middlewares explained

### `addUserToRequestFromJWT`

Look for a valid Learners Guild JWT in:
- the `Authorization` HTTP header
- a cookie named `lgJWT`

If the token is found, verify it, then decode it into a Learners Guild user object and add it to the request in an attribute named `user`. Also add the token itself to the request in an attribute named `lgJWT`.

### `refreshUserFromIDMService`

If the request has a `user` attribute on it, refresh that user data from the [IDM][idm] service and update the `user` attribute with the new data.

### `extendJWTExpiration`

If the request has a `user` attribute on it, create a new JWT from that user with an expiration date 24 hours into the future, then set the `lgJWT` cookie and update the `lgJWT` attribute of the request.


## Utilities

There are also utility functions for working with the JWT within `lib/utils`. See the source for more information.


## License

See the [LICENSE](./LICENSE) file.



[idm]: https://idm.learnersguild.org
