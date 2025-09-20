#!/usr/bin/env node

/**
 * CLI entry point for curlme command-line interface
 */

import { handleCommand } from './utils/cli/index.js'
import {
  displayMandatoryUpdateMessage,
  getLatestVersionFromAPI,
  isUpdateRequired
} from './utils/version-check.js'

const args = process.argv.slice(2)
const command = args[0]

try {
  const updateRequired = await isUpdateRequired()

  if (updateRequired) {
    try {
      const latestVersion = await getLatestVersionFromAPI()
      displayMandatoryUpdateMessage(latestVersion || 'latest')
    } catch {
      displayMandatoryUpdateMessage('latest')
    }

    process.exit(1)
  }
} catch (error) {}

if (!command) {
  await handleCommand('help', [])
  process.exit(0)
}

handleCommand(command, args.slice(1))
