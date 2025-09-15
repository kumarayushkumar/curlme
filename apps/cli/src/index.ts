#!/usr/bin/env node

import { handleCommand } from './utils/cli.js'

const args = process.argv.slice(2)
const command = args[0]

if (!command) {
  console.log(`
Curlme - vibe with developers

Usage:
  curlme <command> [options]

Commands:
  login                      Authenticate with GitHub
  logout                     Clear authentication token
  profile                    Show your profile
  profile <username>         Show another user's profile
  post <content>             Create new post
  post-view <post-id>        View post and its comments
  post-delete <post-id>      Delete post
  post-like <post-id>        Like post
  reply <post-id> <content>  Reply to post
  reply-delete <reply-id>    Delete your reply
  reply-like <reply-id>      Like reply
  feed                       Show feed
  help                       Show this help message

Examples:
  curlme login
  curlme post "Hello from the terminal!"
  curlme reply abc123 "Great post!"
  curlme post-like 123123 
  curlme feed
  curlme profile
`)
  process.exit(0)
}

handleCommand(command, args.slice(1))
