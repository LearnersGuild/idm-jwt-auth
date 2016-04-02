# idm-jwt-auth

Utilities for implementing JWT authentication against the Learners Guild IDM server on Node.js.


## Getting Started

Read the [instructions for contributing](./CONTRIBUTING.md).

1. Clone the repository.

2. Run the setup tasks:

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
      app.use(refreshUserFromIDMService)
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


## License

See the [LICENSE](./LICENSE) file.



[idm]: https://idm.learnersguild.org
