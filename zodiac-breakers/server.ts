import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Multiplayer Types
export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type PlayerPath = 'bomb_master' | 'velocity' | 'blast_force' | 'guardian';

export interface PlayerSession {
  id: string; // unique socket id
  name: string;
  sign: ZodiacSign;
  path: PlayerPath;
  team: 'team_blue' | 'team_red';
  slot: 0 | 1 | 2 | 3;
  isReady: boolean;
  isHost: boolean;
  equippedCardId?: string;
  ping: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderTeam: 'team_blue' | 'team_red';
  text: string;
  time: string;
}

export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  players: Record<string, PlayerSession>;
  status: 'lobby' | 'playing' | 'ended';
  fillBots: boolean;
  is2v2: boolean;
  mapSeed: number;
  chatMessages: ChatMessage[];
  lastActive: number;
}

// In-Memory Rooms Store
const rooms: Record<string, RoomState> = {};
const playerSockets: Map<string, WebSocket> = new Map();
const socketRoomMap: Map<string, string> = new Map();

// Helper to broadcast room state to all members
function broadcastRoom(roomId: string, message: any, excludeSocketId?: string) {
  const room = rooms[roomId];
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const pId of Object.keys(room.players)) {
    if (excludeSocketId && pId === excludeSocketId) continue;
    const ws = playerSockets.get(pId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function getAvailableSlot(room: RoomState): { slot: 0 | 1 | 2 | 3; team: 'team_blue' | 'team_red' } {
  const occupiedSlots = new Set(Object.values(room.players).map((p) => p.slot));
  for (let s = 0; s < 4; s++) {
    if (!occupiedSlots.has(s as 0 | 1 | 2 | 3)) {
      const slot = s as 0 | 1 | 2 | 3;
      const team = slot < 2 ? 'team_blue' : 'team_red';
      return { slot, team };
    }
  }
  return { slot: 0, team: 'team_blue' };
}

// REST API for room operations (guarantees connectivity across all devices and networks)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// SSE Subscribers by roomId: Map<roomId, Set<Response>>
const sseClients: Map<string, Set<express.Response>> = new Map();

function broadcastSse(roomId: string, eventName: string, data: any) {
  const clients = sseClients.get(roomId);
  if (!clients || clients.size === 0) return;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

// Unified room state broadcast (WebSocket + SSE)
function broadcastRoomState(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  const statePayload = {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    players: room.players,
    status: room.status,
    fillBots: room.fillBots,
    is2v2: room.is2v2,
    mapSeed: room.mapSeed,
    chatMessages: room.chatMessages.slice(-30),
  };

  broadcastRoom(roomId, {
    type: 'ROOM_STATE',
    room: statePayload,
  });

  broadcastSse(roomId, 'ROOM_STATE', statePayload);
}

function joinRoomCore(
  rawRoomId: string,
  playerName: string,
  sign: ZodiacSign,
  path: PlayerPath,
  cardId?: string,
  existingPlayerId?: string
): { playerId: string; room: RoomState; player: PlayerSession } {
  const cleanRoom = (rawRoomId || 'ASTRAL-7').toUpperCase().trim().replace(/[^A-Z0-9-]/g, '').slice(0, 12) || 'ASTRAL-7';
  const name = (playerName || 'Astral Fighter').slice(0, 16);
  const playerId = existingPlayerId || 'p_' + Math.random().toString(36).substring(2, 9);

  let room = rooms[cleanRoom];
  let isHost = false;

  if (!room) {
    room = {
      id: cleanRoom,
      name: `Sala ${cleanRoom}`,
      hostId: playerId,
      players: {},
      status: 'lobby',
      fillBots: true,
      is2v2: true,
      mapSeed: Math.floor(Math.random() * 1000000),
      chatMessages: [],
      lastActive: Date.now(),
    };
    rooms[cleanRoom] = room;
    isHost = true;
  } else {
    if (room.hostId === playerId || Object.keys(room.players).length === 0) {
      isHost = true;
      room.hostId = playerId;
    }
  }

  // If player already exists in room, update them
  if (room.players[playerId]) {
    const existing = room.players[playerId];
    existing.name = name;
    existing.sign = sign;
    existing.path = path;
    if (cardId) existing.equippedCardId = cardId;
    room.lastActive = Date.now();
    return { playerId, room, player: existing };
  }

  // Check if room is full
  if (Object.keys(room.players).length >= 4) {
    throw new Error('La sala está completa (4/4 jugadores).');
  }

  const { slot, team } = getAvailableSlot(room);
  const playerSession: PlayerSession = {
    id: playerId,
    name,
    sign,
    path,
    team,
    slot,
    isReady: isHost,
    isHost,
    equippedCardId: cardId,
    ping: 0,
  };

  room.players[playerId] = playerSession;
  room.lastActive = Date.now();

  room.chatMessages.push({
    id: 'sys_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    senderId: 'system',
    senderName: 'SISTEMA',
    senderTeam: team,
    text: `✨ ${name} se ha unido a la Sala (${team === 'team_blue' ? 'Team White' : 'Team Black'}).`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  return { playerId, room, player: playerSession };
}

function processRoomAction(
  roomId: string,
  playerId: string,
  type: string,
  data: any
): RoomState {
  const room = rooms[roomId.toUpperCase()];
  if (!room) throw new Error('Room not found');
  const player = room.players[playerId];
  if (!player) throw new Error('Player not in room');

  room.lastActive = Date.now();

  if (type === 'SET_READY') {
    player.isReady = !!data.isReady;
  } else if (type === 'SWITCH_SLOT') {
    const targetSlot = data.slot as 0 | 1 | 2 | 3;
    if (targetSlot >= 0 && targetSlot <= 3) {
      const isSlotOccupied = Object.values(room.players).some(
        (p) => p.slot === targetSlot && p.id !== playerId
      );
      if (!isSlotOccupied) {
        player.slot = targetSlot;
        player.team = targetSlot < 2 ? 'team_blue' : 'team_red';
      }
    }
  } else if (type === 'UPDATE_PROFILE') {
    if (data.sign) player.sign = data.sign;
    if (data.path) player.path = data.path;
    if (data.name) player.name = data.name.slice(0, 16);
    if (data.equippedCardId !== undefined) player.equippedCardId = data.equippedCardId;
  } else if (type === 'TOGGLE_BOTS') {
    if (player.isHost) {
      room.fillBots = !!data.fillBots;
    }
  } else if (type === 'SEND_CHAT') {
    const text = (data.text || '').trim().slice(0, 140);
    if (text) {
      room.chatMessages.push({
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        senderId: playerId,
        senderName: player.name,
        senderTeam: player.team,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  } else if (type === 'START_GAME') {
    if (player.isHost) {
      room.status = 'playing';
      room.mapSeed = Math.floor(Math.random() * 1000000);
      const startPayload = {
        type: 'GAME_STARTED',
        mapSeed: room.mapSeed,
        fillBots: room.fillBots,
        players: room.players,
      };
      broadcastRoom(roomId, startPayload);
      broadcastSse(roomId, 'GAME_STARTED', startPayload);
    }
  } else if (type === 'RETURN_TO_LOBBY') {
    if (player.isHost) {
      room.status = 'lobby';
      for (const p of Object.values(room.players)) {
        p.isReady = p.isHost;
      }
    }
  }

  broadcastRoomState(roomId);
  return room;
}

// REST Endpoints for 100% Reliable Networking across Links
app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms[req.params.roomId.toUpperCase()];
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    playerCount: Object.keys(room.players).length,
    status: room.status,
    players: room.players,
  });
});

app.get('/api/rooms/:roomId/state', (req, res) => {
  const room = rooms[req.params.roomId.toUpperCase()];
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
});

app.post('/api/rooms/:roomId/join', (req, res) => {
  try {
    const { playerName, sign, path, equippedCardId, playerId } = req.body || {};
    const result = joinRoomCore(
      req.params.roomId,
      playerName,
      sign,
      path,
      equippedCardId,
      playerId
    );
    broadcastRoomState(result.room.id);
    res.json({ success: true, playerId: result.playerId, player: result.player, room: result.room });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to join room' });
  }
});

app.post('/api/rooms/:roomId/action', (req, res) => {
  try {
    const { playerId, type, ...data } = req.body || {};
    const updatedRoom = processRoomAction(req.params.roomId, playerId, type, data);
    res.json({ success: true, room: updatedRoom });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Action failed' });
  }
});

// Server-Sent Events (SSE) Stream for real-time live push updates
app.get('/api/rooms/:roomId/events', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(roomId)) {
    sseClients.set(roomId, new Set());
  }
  sseClients.get(roomId)!.add(res);

  // Send current state immediately
  if (rooms[roomId]) {
    res.write(`event: ROOM_STATE\ndata: ${JSON.stringify(rooms[roomId])}\n\n`);
  }

  req.on('close', () => {
    const clients = sseClients.get(roomId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(roomId);
    }
  });
});

// Setup WebSocket Server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, req) => {
  const socketId = 'p_' + Math.random().toString(36).substring(2, 9);
  playerSockets.set(socketId, ws);

  let lastPingTime = Date.now();

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'PING') {
        const clientSent = msg.time || Date.now();
        ws.send(JSON.stringify({ type: 'PONG', time: clientSent, serverTime: Date.now() }));
        return;
      }

      if (msg.type === 'JOIN_ROOM') {
        const rawCode = (msg.roomId || 'ASTRAL').toUpperCase().trim().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
        const roomId = rawCode || 'ASTRAL-1';
        const playerName = (msg.playerName || 'Astral Fighter').slice(0, 16);
        const sign: ZodiacSign = msg.sign || 'Aries';
        const path: PlayerPath = msg.path || 'bomb_master';
        const cardId = msg.equippedCardId;

        // Leave any existing room
        const currentRoomId = socketRoomMap.get(socketId);
        if (currentRoomId && rooms[currentRoomId]) {
          delete rooms[currentRoomId].players[socketId];
          if (Object.keys(rooms[currentRoomId].players).length === 0) {
            delete rooms[currentRoomId];
          } else {
            if (rooms[currentRoomId].hostId === socketId) {
              const nextHost = Object.keys(rooms[currentRoomId].players)[0];
              rooms[currentRoomId].hostId = nextHost;
              rooms[currentRoomId].players[nextHost].isHost = true;
            }
            broadcastRoomState(currentRoomId);
          }
        }

        // Create or Join Room
        let room = rooms[roomId];
        let isHost = false;

        if (!room) {
          room = {
            id: roomId,
            name: `Sala ${roomId}`,
            hostId: socketId,
            players: {},
            status: 'lobby',
            fillBots: true,
            is2v2: true,
            mapSeed: Math.floor(Math.random() * 1000000),
            chatMessages: [],
            lastActive: Date.now(),
          };
          rooms[roomId] = room;
          isHost = true;
        } else {
          // Check if room is full
          if (Object.keys(room.players).length >= 4) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala está completa (4/4 jugadores).' }));
            return;
          }
          if (room.hostId === socketId || Object.keys(room.players).length === 0) {
            isHost = true;
            room.hostId = socketId;
          }
        }

        const { slot, team } = getAvailableSlot(room);

        const playerSession: PlayerSession = {
          id: socketId,
          name: playerName,
          sign,
          path,
          team,
          slot,
          isReady: isHost, // Host is ready by default
          isHost,
          equippedCardId: cardId,
          ping: 0,
        };

        room.players[socketId] = playerSession;
        socketRoomMap.set(socketId, roomId);

        // Add system message
        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'SISTEMA',
          senderTeam: team,
          text: `✨ ${playerName} se ha unido a la Sala (${team === 'team_blue' ? 'Equipo Azul' : 'Equipo Rojo'}).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        // Send confirmation to joining player
        ws.send(
          JSON.stringify({
            type: 'JOINED_ROOM',
            playerId: socketId,
            roomId,
            player: playerSession,
          })
        );

        broadcastRoomState(roomId);
        return;
      }

      const roomId = socketRoomMap.get(socketId);
      if (!roomId || !rooms[roomId]) return;
      const room = rooms[roomId];
      const player = room.players[socketId];
      if (!player) return;

      room.lastActive = Date.now();

      if (msg.type === 'SET_READY') {
        player.isReady = !!msg.isReady;
        broadcastRoomState(roomId);
      } else if (msg.type === 'SWITCH_SLOT') {
        const targetSlot = msg.slot as 0 | 1 | 2 | 3;
        if (targetSlot >= 0 && targetSlot <= 3) {
          const isSlotOccupied = Object.values(room.players).some(
            (p) => p.slot === targetSlot && p.id !== socketId
          );
          if (!isSlotOccupied) {
            player.slot = targetSlot;
            player.team = targetSlot < 2 ? 'team_blue' : 'team_red';
            broadcastRoomState(roomId);
          }
        }
      } else if (msg.type === 'UPDATE_PROFILE') {
        if (msg.sign) player.sign = msg.sign;
        if (msg.path) player.path = msg.path;
        if (msg.name) player.name = msg.name.slice(0, 16);
        if (msg.equippedCardId !== undefined) player.equippedCardId = msg.equippedCardId;
        broadcastRoomState(roomId);
      } else if (msg.type === 'TOGGLE_BOTS') {
        if (player.isHost) {
          room.fillBots = !!msg.fillBots;
          broadcastRoomState(roomId);
        }
      } else if (msg.type === 'SEND_CHAT') {
        const text = (msg.text || '').trim().slice(0, 140);
        if (text) {
          room.chatMessages.push({
            id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
            senderId: socketId,
            senderName: player.name,
            senderTeam: player.team,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          broadcastRoomState(roomId);
        }
      } else if (msg.type === 'START_GAME') {
        if (player.isHost) {
          room.status = 'playing';
          room.mapSeed = Math.floor(Math.random() * 1000000);
          broadcastRoom(roomId, {
            type: 'GAME_STARTED',
            mapSeed: room.mapSeed,
            fillBots: room.fillBots,
            players: room.players,
          });
          broadcastRoomState(roomId);
        }
      } else if (msg.type === 'GAME_INPUT') {
        // High frequency relay to other players in the room
        broadcastRoom(
          roomId,
          {
            type: 'REMOTE_PLAYER_INPUT',
            playerId: socketId,
            slot: player.slot,
            data: msg.data,
          },
          socketId
        );
      } else if (msg.type === 'GAME_EVENT') {
        // Broadcast discrete game event (bomb placed, skill used, vault bank, shop buy)
        broadcastRoom(
          roomId,
          {
            type: 'REMOTE_GAME_EVENT',
            playerId: socketId,
            slot: player.slot,
            event: msg.event,
            data: msg.data,
          },
          socketId
        );
      } else if (msg.type === 'GAME_HOST_SYNC') {
        // Host state synchronization for match phases / objects
        if (player.isHost) {
          broadcastRoom(
            roomId,
            {
              type: 'GAME_STATE_SNAPSHOT',
              snapshot: msg.snapshot,
            },
            socketId
          );
        }
      } else if (msg.type === 'RETURN_TO_LOBBY') {
        if (player.isHost) {
          room.status = 'lobby';
          for (const p of Object.values(room.players)) {
            p.isReady = p.isHost;
          }
          broadcastRoomState(roomId);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    playerSockets.delete(socketId);
    const roomId = socketRoomMap.get(socketId);
    socketRoomMap.delete(socketId);

    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const departingPlayer = room.players[socketId];
      delete room.players[socketId];

      if (Object.keys(room.players).length === 0) {
        delete rooms[roomId];
      } else {
        if (departingPlayer) {
          room.chatMessages.push({
            id: 'sys_' + Date.now(),
            senderId: 'system',
            senderName: 'SISTEMA',
            senderTeam: departingPlayer.team,
            text: `🚪 ${departingPlayer.name} ha salido de la sala.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }

        if (room.hostId === socketId) {
          const nextHost = Object.keys(room.players)[0];
          room.hostId = nextHost;
          room.players[nextHost].isHost = true;
          room.players[nextHost].isReady = true;
        }

        broadcastRoomState(roomId);
      }
    }
  });
});

// Attach upgrade handler to HTTP server
server.on('upgrade', (request, socket, head) => {
  // Allow websocket upgrade for /ws or root
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Periodic cleanup of idle rooms (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of Object.entries(rooms)) {
    if (Object.keys(room.players).length === 0 || now - room.lastActive > 2 * 3600 * 1000) {
      delete rooms[roomId];
    }
  }
}, 60000);

// Setup Vite or Static File Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Zodiac Breakers Server running on http://localhost:${PORT}`);
  });
}

start();
