/**
 * Voice room handler - connects to the global voice room for real-time audio
 */

import { spawn, execSync, type ChildProcess } from 'child_process'
import WebSocket from 'ws'
import { getToken, isAuthenticated } from '../config.js'
import { colorize, error, heading } from '../output.js'
import { handleLogin } from './auth.js'

type AudioDriver = {
  recCmd: string
  recArgs: string[]
  playCmd: string
  playArgs: string[]
}

function hasCommand(cmd: string): boolean {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${cmd}`, {
      stdio: 'ignore'
    })
    return true
  } catch {
    return false
  }
}

function getAudioDriver(): AudioDriver | null {
  const platform = process.platform

  // raw 16-bit PCM, mono, 16kHz format args for each tool
  if (platform === 'darwin') {
    // macOS: sox (rec/play)
    if (hasCommand('rec')) {
      return {
        recCmd: 'rec',
        recArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ],
        playCmd: 'play',
        playArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ]
      }
    }
    // macOS: ffmpeg as fallback
    if (hasCommand('ffmpeg')) {
      return {
        recCmd: 'ffmpeg',
        recArgs: [
          '-f',
          'avfoundation',
          '-i',
          ':default',
          '-ar',
          '16000',
          '-ac',
          '1',
          '-f',
          's16le',
          '-loglevel',
          'quiet',
          'pipe:1'
        ],
        playCmd: 'ffplay',
        playArgs: [
          '-f',
          's16le',
          '-ar',
          '16000',
          '-ac',
          '1',
          '-nodisp',
          '-loglevel',
          'quiet',
          '-i',
          'pipe:0'
        ]
      }
    }
  }

  if (platform === 'linux') {
    // Linux: arecord/aplay (ALSA, pre-installed on most distros)
    if (hasCommand('arecord')) {
      return {
        recCmd: 'arecord',
        recArgs: [
          '-f',
          'S16_LE',
          '-c',
          '1',
          '-r',
          '16000',
          '-t',
          'raw',
          '-q',
          '-'
        ],
        playCmd: 'aplay',
        playArgs: [
          '-f',
          'S16_LE',
          '-c',
          '1',
          '-r',
          '16000',
          '-t',
          'raw',
          '-q',
          '-'
        ]
      }
    }
    // Linux: sox fallback
    if (hasCommand('rec')) {
      return {
        recCmd: 'rec',
        recArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ],
        playCmd: 'play',
        playArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ]
      }
    }
  }

  if (platform === 'win32') {
    // Windows: sox via choco/scoop, or ffmpeg
    if (hasCommand('rec')) {
      return {
        recCmd: 'rec',
        recArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ],
        playCmd: 'play',
        playArgs: [
          '-t',
          'raw',
          '-b',
          '16',
          '-c',
          '1',
          '-r',
          '16000',
          '-e',
          'signed-integer',
          '-q',
          '-'
        ]
      }
    }
    if (hasCommand('ffmpeg')) {
      return {
        recCmd: 'ffmpeg',
        recArgs: [
          '-f',
          'dshow',
          '-i',
          'audio=default',
          '-ar',
          '16000',
          '-ac',
          '1',
          '-f',
          's16le',
          '-loglevel',
          'quiet',
          'pipe:1'
        ],
        playCmd: 'ffplay',
        playArgs: [
          '-f',
          's16le',
          '-ar',
          '16000',
          '-ac',
          '1',
          '-nodisp',
          '-loglevel',
          'quiet',
          '-i',
          'pipe:0'
        ]
      }
    }
  }

  return null
}

function printInstallHelp() {
  const platform = process.platform
  error('No supported audio tool found.')
  console.log()
  if (platform === 'darwin') {
    console.log('  Install one of:')
    console.log(colorize('    brew install sox', 'highlight'))
    console.log(colorize('    brew install ffmpeg', 'grey'))
  } else if (platform === 'linux') {
    console.log('  Install one of:')
    console.log(colorize('    sudo apt install alsa-utils', 'highlight'))
    console.log(colorize('    sudo apt install sox libsox-fmt-all', 'grey'))
  } else if (platform === 'win32') {
    console.log('  Install one of:')
    console.log(colorize('    choco install sox', 'highlight'))
    console.log(colorize('    scoop install ffmpeg', 'grey'))
  }
}

function getWsUrl(): string {
  const base =
    process.env.NODE_ENV === 'development'
      ? 'ws://localhost:8000'
      : 'wss://api.curlme.dev'
  return `${base}/ws/voiceroom`
}

export async function handleVoiceRoom(): Promise<void> {
  // Check for audio tools
  const _driver = getAudioDriver()
  if (!_driver) {
    printInstallHelp()
    return
  }
  const driver: AudioDriver = _driver

  // Check auth
  if (!isAuthenticated()) {
    heading('Authentication required for voice room. Logging you in...')
    await handleLogin()
    if (!isAuthenticated()) return
  }

  const token = getToken()!
  const wsUrl = `${getWsUrl()}?token=${token}`

  console.clear()
  heading('Connecting to voice room...')

  const ws = new WebSocket(wsUrl)
  let rec: ChildProcess | null = null
  let play: ChildProcess | null = null
  let muted = false
  let participants: { username: string; muted: boolean }[] = []

  function renderUI() {
    console.clear()
    console.log(colorize('Voice Room', 'bold'))
    console.log()

    if (participants.length === 0) {
      console.log(colorize('  No other participants yet...', 'grey'))
    } else {
      for (const p of participants) {
        const muteIcon = p.muted ? ' (muted)' : ''
        console.log(`  @${p.username}${colorize(muteIcon, 'grey')}`)
      }
    }

    console.log()
    const micStatus = muted
      ? colorize('Mic: OFF', 'red')
      : colorize('Mic: ON', 'green')
    console.log(`  ${micStatus}`)
    console.log()
    console.log(colorize('m - mute/unmute | q - leave', 'grey'))
  }

  function startAudio() {
    rec = spawn(driver.recCmd, driver.recArgs, {
      stdio: ['ignore', 'pipe', 'ignore']
    })

    rec.stdout?.on('data', (chunk: Buffer) => {
      if (!muted && ws.readyState === WebSocket.OPEN) {
        ws.send(chunk)
      }
    })

    rec.on('error', () => {
      error(`Failed to start microphone (${driver.recCmd}).`)
    })

    play = spawn(driver.playCmd, driver.playArgs, {
      stdio: ['pipe', 'ignore', 'ignore']
    })

    play.on('error', () => {
      error(`Failed to start audio playback (${driver.playCmd}).`)
    })
  }

  function cleanup() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.removeAllListeners('data')
    rec?.kill()
    play?.kill()
    if (ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    console.log(colorize('\nLeft voice room.', 'grey'))
    process.exit(0)
  }

  ws.on('open', () => {
    startAudio()
    renderUI()

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
      process.stdin.setEncoding('utf8')
    }

    process.stdin.on('data', (key: Buffer) => {
      const k = key.toString()
      switch (k) {
        case 'm':
        case 'M':
          muted = !muted
          ws.send(JSON.stringify({ type: 'mute', muted }))
          renderUI()
          break
        case 'q':
        case 'Q':
        case '\u0003':
          cleanup()
          break
      }
    })
  })

  ws.on('message', (data: Buffer, isBinary: boolean) => {
    if (isBinary) {
      play?.stdin?.write(data)
    } else {
      try {
        const msg = JSON.parse(data.toString())
        switch (msg.type) {
          case 'room-state':
            participants = msg.participants
            renderUI()
            break
          case 'participant-joined':
            participants.push({ username: msg.username, muted: false })
            renderUI()
            break
          case 'participant-left':
            participants = participants.filter(p => p.username !== msg.username)
            renderUI()
            break
          case 'participant-muted':
            participants = participants.map(p =>
              p.username === msg.username ? { ...p, muted: msg.muted } : p
            )
            renderUI()
            break
          case 'error':
            error(msg.message)
            cleanup()
            break
        }
      } catch {}
    }
  })

  ws.on('error', err => {
    error(`Connection error: ${err.message}`)
    cleanup()
  })

  ws.on('close', () => {
    console.log(colorize('\nDisconnected from voice room.', 'grey'))
    rec?.kill()
    play?.kill()
    process.exit(0)
  })

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
