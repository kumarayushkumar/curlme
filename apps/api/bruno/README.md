# curlme API - Bruno collection

Every route the API exposes, as a [Bruno](https://usebruno.com) collection.
Open this directory in the Bruno app, or run it headless with `@usebruno/cli`.

## Layout

| Folder         | Routes                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| `Curlme`       | `GET /` and `GET /feedback`, the two unauthenticated root endpoints       |
| `Auth`         | register, signin and the GitHub device flow                               |
| `Designations` | the public catalogue read before registering                              |
| `Profile`      | your own profile and anyone else's                                        |
| `Follow`       | follow, unfollow, followers and following                                 |
| `Posts`        | feed, create, read, like and delete                                       |
| `Replies`      | create, like and delete                                                   |
| `Admin`        | the `/api/admin` monitoring tables and the two user administration routes |

## Getting a session

The collection declares bearer auth once at the root, so every authenticated
request inherits it and reads `{{token}}` from the environment.

Pick the `Local` environment, then run `Auth > register` or `Auth > signin`.
Both write `token` into the environment, and everything else works from there.

`Posts > create post` and `Replies > create reply` write `postId` and
`replyId` the same way, so the requests that act on them need no copy and
paste.

## Running the whole collection

```sh
cd apps/api/bruno
npx @usebruno/cli run -r --env Local --delay 1500 --exclude-tags destructive,manual
```

`--delay` is not optional.
Every route sits behind a limiter of 10 requests per 10 seconds per IP, so an
undelayed run starts returning 429 from about the seventh request onward.

Two tags keep an unattended run clean.
`destructive` marks the requests that would break what follows, notably
`Posts > delete post`, which removes the very post the `Replies` folder needs.
`manual` marks the GitHub device flow, which needs a browser step in the middle.

The run is idempotent.
The requests that would collide on a second run - `register`,
`register follow target`, `follow user` and `create designation` - accept the
conflict status alongside the created one, so nothing has to be reset between
runs.

## Environments

`Local` points at `http://localhost:8000`, `Production` at
`http://api.curlme.dev`, matching the two branches in the CLI's `ApiClient`.

| Variable                                             | Purpose                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `baseUrl`                                            | API origin                                                                                             |
| `username`, `password`, `name`, `designation`, `bio` | registration and sign in payload                                                                       |
| `token`                                              | bearer token, written by register and signin, held as a secret so it is never committed                |
| `targetUsername`, `targetPassword`                   | the second account the follow and admin user routes act on, created by `Auth > register follow target` |
| `postId`, `replyId`                                  | written by create post and create reply                                                                |
| `deviceCode`                                         | written by the GitHub device flow start                                                                |

## The Admin folder

Those routes need a token whose account currently has the ADMIN role, which
`authMiddleware` re-reads from the database on every request.
Without one they answer 403.

Add the username to `ADMIN_USERNAMES` in `apps/api/.env` and run
`npm run db:seed`, or have an existing admin call `Admin > set user role`.

`set user role` defaults to `USER` and `set user active` defaults to `true`, so
an unattended run neither hands out admin nor leaves an account locked out.
Send `ADMIN` and `false` to exercise the other direction.
