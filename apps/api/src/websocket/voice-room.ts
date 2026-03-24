/**
 * Global voice room - manages a single voice room with WebSocket connections
 */

import type { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import type http from 'http'
import { verifyToken } from '../utils/jwt.js'
import { logger } from '../utils/logger.js'

interface Participant {
  ws: WebSocket
  userId: string
  username: string
  muted: boolean
}

const participants = new Map<string, Participant>()

function broadcastControl(message: object, excludeUserId?: string) {
  const data = JSON.stringify(message)
  for (const [userId, p] of participants) {
    if (userId !== excludeUserId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data)
    }
  }
}

function sendRoomState(ws: WebSocket) {
  const users = Array.from(participants.values()).map(p => ({
    username: p.username,
    muted: p.muted
  }))
  ws.send(JSON.stringify({ type: 'room-state', participants: users }))
}

export function setupVoiceRoom(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)

    if (url.pathname !== '/ws/voiceroom') {
      socket.destroy()
      return
    }

    const token = url.searchParams.get('token')
    if (!token) {
      socket.destroy()
      return
    }

    try {
      const decoded = verifyToken(token)
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, decoded)
      })
    } catch {
      socket.destroy()
    }
  })

  wss.on(
    'connection',
    (ws: WebSocket, user: { userId: string; username: string }) => {
      // Reject if already in the room
      if (participants.has(user.userId)) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'You are already in the voice room'
          })
        )
        ws.close()
        return
      }

      participants.set(user.userId, {
        ws,
        userId: user.userId,
        username: user.username,
        muted: false
      })

      logger.info(
        `voice room: ${user.username} joined (${participants.size} participants)`
      )

      // Send room state to the new participant
      sendRoomState(ws)

      // Notify others
      broadcastControl(
        { type: 'participant-joined', username: user.username },
        user.userId
      )

      ws.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          // Audio data - relay to all other participants
          for (const [userId, p] of participants) {
            if (userId !== user.userId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(data, { binary: true })
            }
          }
        } else {
          // Control message
          try {
            const msg = JSON.parse(data.toString())
            if (msg.type === 'mute') {
              const p = participants.get(user.userId)
              if (p) p.muted = msg.muted
              broadcastControl(
                {
                  type: 'participant-muted',
                  username: user.username,
                  muted: msg.muted
                },
                user.userId
              )
            }
          } catch {}
        }
      })

      ws.on('close', () => {
        participants.delete(user.userId)
        logger.info(
          `voice room: ${user.username} left (${participants.size} participants)`
        )
        broadcastControl({ type: 'participant-left', username: user.username })
      })

      ws.on('error', err => {
        logger.error(`voice room ws error for ${user.username}: ${err.message}`)
        participants.delete(user.userId)
      })
    }
  )

  logger.info('voice room websocket ready on /ws/voiceroom')
}
