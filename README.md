# Curlme

> A terminal-only social network for developers, accessible via curl

curlme is a platform designed specifically for developers who love the command line. Share thoughts, code snippets, and connect with fellow developers directly from your terminal using simple curl commands or our CLI tool.

## Features

- **Terminal-First**: Post, read, and interact entirely from your terminal
- **GitHub Authentication**: Secure OAuth integration with GitHub
- **Real-time Feed**: Browse posts from the developer community
- **Threaded Conversations**: Reply to posts and engage in discussions
- **Like System**: Show appreciation for posts and replies
- **CLI Tool**: Optional command-line interface for enhanced experience
- **RESTful API**: Clean, well-documented API endpoints
- **Fast & Cached**: Redis caching for optimal performance

## Quick Start

```bash
# Install globally
sudo npm install -g curlme

# Get started
curlme --help

# Login
curlme login

# Post something
curlme post "Just deployed my app!"

# Browse feed
curlme feed

# Reply to a post
curlme reply POST_ID "Congratulations!"
```

## API Endpoints

### Authentication

- `POST /login` - Start GitHub OAuth flow
- `GET /curlme` - Get started guide

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

- `GET /user/:username` - Get user profile

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

_Star ⭐ this repo if you find it useful!_
