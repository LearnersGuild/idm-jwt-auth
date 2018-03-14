# idm-jwt-auth

[![Code Climate](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth/badges/gpa.svg)](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth)
[![Issue Count](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth/badges/issue_count.svg)](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth)
[![Test Coverage](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth/badges/coverage.svg)](https://codeclimate.com/github/LearnersGuild/idm-jwt-auth/coverage)

Utilities for implementing JWT authentication against the Learners Guild IDM server on Node.js.


## Getting Started

Read the [instructions for contributing](./CONTRIBUTING.md).

1. **Globally** install [nvm][nvm], [avn][avn], and [avn-nvm][avn-nvm].

    ```bash
    curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
    npm install -g avn avn-nvm
    avn setup
    ```

2. Clone the repository.

3. Run the setup tasks:

        $ npm install
        $ npm run test


## How to Use

1. Install the module in your project

      $ npm install --save @learnersguild/idm-jwt-auth

2. Install the middlewares that you want:

      ```javascript
      import {
        addUserToRequestFromJWT,
        refreshUserFromIDMService,
        extendJWTExpiration
      } from '@learnersguild/idm-jwt-auth/lib/middlewares'

      # ...
      # ... set up your Express app ...
      # ...

      app.use(addUserToRequestFromJWT)
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
      app.use(extendJWTExpiration)
      ```

## Middlewares

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


## Examples

Checkout [this example app](./example-app.js)
that uses IDM for auth and can query both `idm` and `game`.

## License

See the [LICENSE](./LICENSE) file.


[idm]: https://idm.learnersguild.org
[nvm]: https://github.com/creationix/nvm
[avn]: https://github.com/wbyoung/avn
[avn-nvm]: https://github.com/wbyoung/avn-nvm
