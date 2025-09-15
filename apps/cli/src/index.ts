#!/usr/bin/env node

import { handleCommand } from './utils/cli/index.js'

const args = process.argv.slice(2)
const command = args[0]

if (!command) {
  await handleCommand('help', [])
  process.exit(0)
}

handleCommand(command, args.slice(1))
