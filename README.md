# Curlme

> A terminal-only social network for developers, accessible via curl

> [!WARNING]
> **This project is retired.** The servers have been shut down, so the API and the
> `curlme` CLI no longer respond. The source here is still available to read.
>
> - [**Watch the demo**](https://www.linkedin.com/feed/update/urn:li:activity:7449001272864854016/) - see it actually running
> - [**curlme.live**](https://curlme.live)

curlme is a platform designed specifically for developers who love the command line. Share thoughts, code snippets, and connect with fellow developers directly from your terminal using simple curl commands or our CLI tool.

## Features

- **Terminal-First**: Post, read, and interact entirely from your terminal
- **Two Ways In**: GitHub OAuth, or a username and password account
- **Designations**: Register as a creator or a consumer, drawn from a seeded pool of
  38 designations grouped into engineering, creative, business, outside_tech and
  unsettled. The pool lives in the database and admins extend it at runtime, so
  nothing about it is hardcoded.
- **Follow Graph**: Follow and unfollow users, and browse followers and followees
- **Real-time Feed**: Browse posts from the developer community
- **Threaded Conversations**: Reply to posts and engage in discussions
- **Like System**: Show appreciation for posts and replies
- **Admin Monitoring**: Platform statistics rendered as tables in the terminal
- **Soft Delete**: Accounts deactivate rather than vanish, keeping their username
  reserved and their posts intact
- **CLI Tool**: Optional command-line interface for enhanced experience
- **RESTful API**: Clean, well-documented API endpoints
- **Fast & Cached**: Redis caching for optimal performance

## Quick Start

```bash
# Install globally
sudo npm install -g curlme

# Point the CLI at your server (the public host is retired)
export CURLME_API_URL=http://localhost:8000

# Get started
curlme help

# See what you can register as, then create an account
curlme designations
curlme register

# Or sign in with GitHub instead
curlme login

# Post something
curlme post "Just deployed my app!"

# Browse feed
curlme feed

# Reply to a post
curlme reply POST_ID "Congratulations!"

# Follow people and see your graph
curlme follow ada
curlme followers
curlme following ada

# Admins only
curlme admin dashboard
```

## API Endpoints

All endpoints below are mounted under `/api`, except the landing and feedback
routes which sit at the root.

### Authentication

- `POST /api/login` - Start or complete the GitHub OAuth device flow
- `POST /api/register` - Create an account with a username, password and designation
- `POST /api/signin` - Exchange a username and password for a token

### Designations

- `GET /api/designations?category=CREATOR|CONSUMER&group=engineering` - List the
  designations available at registration, optionally filtered by category or group.
  Unauthenticated, because a client needs it before it has a token.

### Follow graph

- `POST /api/follow/:username` - Follow a user
- `DELETE /api/unfollow/:username` - Unfollow a user
- `GET /api/followers[/:username]?page=1` - Who follows you, or another user
- `GET /api/following[/:username]?page=1` - Who you follow, or who another user follows

### Admin

Every route requires the `ADMIN` role, which is read from the database on each
request so a revoked admin loses access immediately rather than when their token
expires.

- `GET /api/admin/dashboard?limit=10` - Every statistic below in one response
- `GET /api/admin/overview` - Platform wide counters
- `GET /api/admin/top-followed?limit=10` - Users ranked by follower count
- `GET /api/admin/top-posts?limit=10` - Posts ranked by likes
- `GET /api/admin/top-engaged?limit=10` - Users ranked by posts plus replies
- `GET /api/admin/follow-graph?limit=10` - Who follows whom, with mutual flags
- `GET /api/admin/designations` - Accounts and followers per designation
- `POST /api/admin/designations` - Add a designation
- `PATCH /api/admin/users/:username/role` - Promote or demote an account
- `PATCH /api/admin/users/:username/active` - Deactivate or reactivate an account

### Posts

- `GET /feed?page=1&limit=50` - Get feed with pagination
- `GET /get-post/:postId?page=1` - Get specific post with replies
- `POST /create-post` - Create a new post
- `DELETE /delete-post/:postId` - Delete your post
- `POST /toggle-like-post/:postId` - Like/unlike a post

### Replies

- `POST /create-reply/:postId` - Reply to a post
- `DELETE /delete-reply/:replyId` - Delete your reply
- `POST /toggle-like-reply/:replyId` - Like/unlike a reply

### Users

- `GET /api/profile` - Your own profile
- `GET /api/profile/:username` - Another user's profile, including whether you
  follow each other
- `PATCH /api/profile` - Edit your own bio

## Denormalised counters

`User` carries `followerCount`, `followingCount`, `postCount` and
`totalLikesReceived`. Each is written inside the same transaction as the row it
summarises - the follow edge, the post, the like - so the admin leaderboards sort
on an indexed integer instead of running `COUNT(*)` across a growing table on
every read. `totalLikesReceived` belongs to the author of the liked content and
covers posts and replies alike, including the fan-out when deleting a post takes
other people's replies with it.

## Soft delete

Setting `isActive` to false keeps the username reserved and the content in place,
but the account can no longer sign in, is hidden from profiles, follow listings
and every admin leaderboard, and is reported separately in the overview. Sign in
for a deactivated account fails with the same `invalid_credentials` error as a
wrong password, so deactivation is not detectable from outside.

## Database

With Docker, nothing to do: the `migrate` service applies migrations and seeds
the designation pool before the API starts, so a fresh `docker compose up`
always comes up against a provisioned database.

```bash
docker compose up -d          # migrate runs first, then api
docker compose logs migrate   # what it applied
```

Set `ADMIN_USERNAMES` in `.env` to bootstrap an admin. The seed can only promote
accounts that already exist, so re-run it once that user has registered:

```bash
docker compose run --rm migrate sh -c "npx tsx prisma/seed.ts"
```

Running the API outside Docker instead:

```bash
cd apps/api
npm run db:migrate     # apply migrations (prisma migrate deploy)
npm run db:seed        # seed designations, promote ADMIN_USERNAMES to admin
```

`db:seed` is idempotent. It inserts the starting designations and promotes every
username listed in `ADMIN_USERNAMES` to `ADMIN`; re-run it after a bootstrap admin
has registered. Designations are rows, not an enum, so admins can add more at any
time with `curlme admin add-designation`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

_Star ⭐ this repo if you find it useful!_
