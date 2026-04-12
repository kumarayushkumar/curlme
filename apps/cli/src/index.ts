#!/usr/bin/env node

/**
 * CLI entry point for curlme command-line interface
 */

import { execSync, spawn } from 'child_process'
import { handleCommand } from './utils/cli/index.js'
import {
  displayMandatoryUpdateMessage,
  getLatestVersionFromAPI,
  isUpdateRequired
} from './utils/version-check.js'

const WINDOWED_COMMANDS = ['feed', 'voiceroom']

function openInNewTerminal(cmd: string): boolean {
  const platform = process.platform
  try {
    if (platform === 'darwin') {
      const term = process.env.TERM_PROGRAM || ''
      // Run osascript detached so our process can exit while it monitors the tab
      // After cmd exits, the shell runs a self-close osascript.
      // \" is AppleScript's escaped double-quote inside a string literal.
      let scriptLines: string[]
      if (term === 'iTerm.app') {
        scriptLines = [
          'tell application "iTerm2"',
          `  create window with default profile command "${cmd}; osascript -e 'tell application \\"iTerm2\\" to close first window'"`,
          'end tell'
        ]
      } else {
        scriptLines = [
          'tell application "Terminal"',
          '  activate',
          `  do script "${cmd}; osascript -e 'tell application \\"Terminal\\" to close front window'"`,
          'end tell'
        ]
      }
      const osaArgs = scriptLines.flatMap(line => ['-e', line])
      const osa = spawn('osascript', osaArgs, {
        detached: true,
        stdio: 'ignore'
      })
      osa.unref()
      return true
    } else if (platform === 'linux') {
      const terminals: [string, string][] = [
        ['gnome-terminal', `gnome-terminal -- bash -c '${cmd}'`],
        ['konsole', `konsole -e bash -c '${cmd}'`],
        ['xfce4-terminal', `xfce4-terminal -e 'bash -c "${cmd}"'`],
        ['xterm', `xterm -e '${cmd}'`]
      ]
      for (const [bin, launch] of terminals) {
        try {
          execSync(`which ${bin}`, { stdio: 'ignore' })
          execSync(`${launch} &`)
          return true
        } catch {}
      }
    } else if (platform === 'win32') {
      execSync(`start cmd /k "${cmd}"`)
      return true
    }
  } catch {}
  return false
}

const rawArgs = process.argv.slice(2)
const isSpawned = rawArgs.includes('--spawned')
const args = rawArgs.filter(a => a !== '--spawned')
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

if (!isSpawned && WINDOWED_COMMANDS.includes(command)) {
  const opened = openInNewTerminal(`curlme ${command} --spawned`)
  if (opened) process.exit(0)
  // fall through and run in current terminal if new window couldn't be opened
}

handleCommand(command, args.slice(1))
