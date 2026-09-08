# Curlme CLI

A CLI tool for developers to interact with Curlme services from the terminal.

## Installation

```bash
sudo npm install -g curlme
```

## Configuration

The CLI talks to `http://api.curlme.dev` by default, which is retired. Point it
at your own deployment:

```bash
export CURLME_API_URL=http://localhost:8000
```

## Usage

```bash
# Get help
curlme help

# Create an account (see the options first)
curlme designations
curlme register

# Or authenticate with GitHub
curlme login

# View the feed
curlme feed
```

## Commands

### Authentication

| Command                      | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `curlme register [username]` | Create an account with a password and a designation |
| `curlme signin [username]`   | Sign in with your password                          |
| `curlme login`               | Authenticate with GitHub                            |
| `curlme logout`              | Clear the stored token                              |

Passwords are only ever read from an interactive prompt, never from a command
line argument, so they stay out of your shell history and the process list.

### Profile and designations

Designations are grouped into `engineering`, `creative`, `business`,
`outside_tech` and `unsettled` for consumers, and by subject for creators. The
pool is seeded into the database, so an admin can add to it without a release.

| Command                                           | Description                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `curlme profile [username]`                       | Your profile, or someone else's                                                      |
| `curlme designations [creator\|consumer] [group]` | List the designations you can register as, optionally filtered by category and group |
| `curlme bio "<text>"`                             | Edit your own bio                                                                    |

### Following

| Command                              | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `curlme follow <username>`           | Follow a user                               |
| `curlme unfollow <username>`         | Unfollow a user                             |
| `curlme followers [username] [page]` | Who follows you, or another user            |
| `curlme following [username] [page]` | Who you follow, or who another user follows |

### Posts and replies

| Command                              | Description                 |
| ------------------------------------ | --------------------------- |
| `curlme post "<content>"`            | Create a post               |
| `curlme post-view <post-id> [page]`  | View a post and its replies |
| `curlme post-delete <post-id>`       | Delete your post            |
| `curlme post-like <post-id>`         | Like or unlike a post       |
| `curlme reply <post-id> "<content>"` | Reply to a post             |
| `curlme reply-delete <reply-id>`     | Delete your reply           |
| `curlme reply-like <reply-id>`       | Like or unlike a reply      |

### Feed and voice

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `curlme feed`      | Interactive feed, navigate with the arrow keys |
| `curlme voiceroom` | Join the global voice room (requires `sox`)    |

### Admin

Available to accounts with the `ADMIN` role. Every subcommand renders a table.

| Command                                                                     | Description                            |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `curlme admin dashboard [limit]`                                            | Every statistic below, in one request  |
| `curlme admin overview`                                                     | Platform wide counters                 |
| `curlme admin top-followed [limit]`                                         | Users ranked by follower count         |
| `curlme admin top-posts [limit]`                                            | Posts ranked by likes                  |
| `curlme admin top-engaged [limit]`                                          | Users ranked by posts plus replies     |
| `curlme admin follow-graph [limit]`                                         | Who follows whom, with mutual flags    |
| `curlme admin designations`                                                 | Accounts and followers per designation |
| `curlme admin promote <username>`                                           | Grant the admin role                   |
| `curlme admin demote <username>`                                            | Revoke the admin role                  |
| `curlme admin add-designation <slug> "<label>" <creator\|consumer> [field]` | Add a designation                      |

## Repository

More Info [https://github.com/kumarayushkumar/curlme](https://github.com/kumarayushkumar/curlme)
