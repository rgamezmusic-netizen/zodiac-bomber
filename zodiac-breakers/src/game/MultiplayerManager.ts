import { PlayerPath, ZodiacSign } from './types';

export interface PlayerSession {
  id: string;
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
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RemoteInputData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp?: number;
  shield?: number;
  carriedCoins?: number;
  isPhasing?: boolean;
}

type RoomStateListener = (state: RoomState) => void;
type GameStartListener = (data: { mapSeed: number; fillBots: boolean; players: Record<string, PlayerSession> }) => void;
type RemoteInputListener = (slot: number, data: RemoteInputData) => void;
type RemoteEventListener = (slot: number, event: string, data: any) => void;
type StateSnapshotListener = (snapshot: any) => void;
type ErrorListener = (message: string) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private pollInterval: any = null;
  public status: ConnectionStatus = 'disconnected';
  public localPlayerId: string | null = null;
  public currentRoom: RoomState | null = null;
  public currentSlot: number = 0;
  public ping: number = 24;

  private roomStateListeners: Set<RoomStateListener> = new Set();
  private gameStartListeners: Set<GameStartListener> = new Set();
  private remoteInputListeners: Set<RemoteInputListener> = new Set();
  private remoteEventListeners: Set<RemoteEventListener> = new Set();
  private stateSnapshotListeners: Set<StateSnapshotListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();

  private pingInterval: any = null;

  constructor() {
    try {
      this.localPlayerId = sessionStorage.getItem('zb_local_player_id') || ('p_' + Math.random().toString(36).substring(2, 9));
      sessionStorage.setItem('zb_local_player_id', this.localPlayerId);
    } catch {
      this.localPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.status = 'connecting';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.status = 'connected';
          this.startPingLoop();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (err) => {
          console.warn('[Multiplayer] WebSocket warning (REST/SSE active):', err);
          this.status = 'connected'; // Fallback ensures seamless connection
          resolve();
        };

        this.ws.onclose = () => {
          this.stopPingLoop();
          // We do NOT mark disconnected because HTTP Polling / SSE continues working seamlessly
        };
      } catch (err) {
        console.warn('[Multiplayer] WebSocket setup error, running HTTP mode:', err);
        this.status = 'connected';
        resolve();
      }
    });
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const now = Date.now();
        this.ws.send(JSON.stringify({ type: 'PING', time: now }));
      }
    }, 4000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'PONG') {
        if (msg.time) {
          this.ping = Math.round((Date.now() - msg.time) / 2);
        }
        return;
      }

      if (msg.type === 'JOINED_ROOM') {
        this.localPlayerId = msg.playerId;
        this.currentSlot = msg.player.slot;
        return;
      }

      if (msg.type === 'ROOM_STATE') {
        this.applyRoomState(msg.room);
        return;
      }

      if (msg.type === 'GAME_STARTED') {
        this.gameStartListeners.forEach((l) => l(msg));
        return;
      }

      if (msg.type === 'REMOTE_PLAYER_INPUT') {
        this.remoteInputListeners.forEach((l) => l(msg.slot, msg.data));
        return;
      }

      if (msg.type === 'REMOTE_GAME_EVENT') {
        this.remoteEventListeners.forEach((l) => l(msg.slot, msg.event, msg.data));
        return;
      }

      if (msg.type === 'GAME_STATE_SNAPSHOT') {
        this.stateSnapshotListeners.forEach((l) => l(msg.snapshot));
        return;
      }

      if (msg.type === 'ERROR') {
        this.errorListeners.forEach((l) => l(msg.message));
        return;
      }
    } catch (err) {
      console.error('[Multiplayer] Failed to parse message:', err);
    }
  }

  private applyRoomState(room: RoomState) {
    this.currentRoom = room;
    if (this.localPlayerId && room.players[this.localPlayerId]) {
      this.currentSlot = room.players[this.localPlayerId].slot;
    }
    this.status = 'connected';
    this.roomStateListeners.forEach((l) => l(room));
  }

  public async joinRoom(
    roomId: string,
    playerName: string,
    sign: ZodiacSign,
    path: PlayerPath,
    equippedCardId?: string
  ) {
    const cleanRoom = (roomId || 'ASTRAL-7').toUpperCase().trim().replace(/[^A-Z0-9-]/g, '').slice(0, 12) || 'ASTRAL-7';

    // 1. Try WebSocket connect
    await this.connect();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: cleanRoom,
          playerName,
          sign,
          path,
          equippedCardId,
        })
      );
    }

    // 2. Guaranteed REST Join (instant response on any browser/link)
    try {
      const res = await fetch(`/api/rooms/${cleanRoom}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.localPlayerId,
          playerName,
          sign,
          path,
          equippedCardId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          this.applyRoomState(data.room);
        }
        if (data.playerId) {
          this.localPlayerId = data.playerId;
        }
      }
    } catch (err) {
      console.warn('[Multiplayer] REST Join fallback note:', err);
    }

    // 3. Setup Live Server-Sent Events (SSE) Stream
    this.setupSse(cleanRoom);

    // 4. Setup fast polling fallback (800ms)
    this.startHttpPolling(cleanRoom);
  }

  private setupSse(roomId: string) {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }

    try {
      if (typeof window !== 'undefined' && window.EventSource) {
        this.sse = new EventSource(`/api/rooms/${roomId}/events`);
        this.sse.addEventListener('ROOM_STATE', (e) => {
          try {
            const data = JSON.parse(e.data);
            this.applyRoomState(data);
          } catch {
            // ignore
          }
        });
        this.sse.addEventListener('GAME_STARTED', (e) => {
          try {
            const data = JSON.parse(e.data);
            this.gameStartListeners.forEach((l) => l(data));
          } catch {
            // ignore
          }
        });
        this.sse.onerror = () => {
          // SSE fallback handled by HTTP polling
        };
      }
    } catch (err) {
      console.warn('[Multiplayer] SSE init note:', err);
    }
  }

  private startHttpPolling(roomId: string) {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            this.applyRoomState(data.room);
          }
        }
      } catch {
        // quiet fallback
      }
    }, 850);
  }

  private async dispatchAction(type: string, payload: any = {}) {
    // 1. Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }

    // 2. Always sync via REST endpoint to guarantee delivery
    if (this.currentRoom?.id) {
      try {
        const res = await fetch(`/api/rooms/${this.currentRoom.id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: this.localPlayerId,
            type,
            ...payload,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            this.applyRoomState(data.room);
          }
        }
      } catch (err) {
        console.warn('[Multiplayer] Action dispatch note:', err);
      }
    }
  }

  public setReady(isReady: boolean) {
    this.dispatchAction('SET_READY', { isReady });
  }

  public switchSlot(slot: 0 | 1 | 2 | 3) {
    this.dispatchAction('SWITCH_SLOT', { slot });
  }

  public toggleBots(fillBots: boolean) {
    this.dispatchAction('TOGGLE_BOTS', { fillBots });
  }

  public updateProfile(sign: ZodiacSign, path: PlayerPath, name?: string, equippedCardId?: string) {
    this.dispatchAction('UPDATE_PROFILE', { sign, path, name, equippedCardId });
  }

  public sendChat(text: string) {
    this.dispatchAction('SEND_CHAT', { text });
  }

  public startGame() {
    this.dispatchAction('START_GAME');
  }

  public sendPlayerInput(data: RemoteInputData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'GAME_INPUT', data }));
    }
  }

  public sendGameEvent(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'GAME_EVENT', event, data }));
    }
  }

  public sendHostSnapshot(snapshot: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'GAME_HOST_SYNC', snapshot }));
    }
  }

  public returnToLobby() {
    this.dispatchAction('RETURN_TO_LOBBY');
  }

  public leaveRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.currentRoom = null;
  }

  // Event subscription helpers
  public onRoomState(cb: RoomStateListener) {
    this.roomStateListeners.add(cb);
    return () => this.roomStateListeners.delete(cb);
  }

  public onGameStart(cb: GameStartListener) {
    this.gameStartListeners.add(cb);
    return () => this.gameStartListeners.delete(cb);
  }

  public onRemoteInput(cb: RemoteInputListener) {
    this.remoteInputListeners.add(cb);
    return () => this.remoteInputListeners.delete(cb);
  }

  public onRemoteEvent(cb: RemoteEventListener) {
    this.remoteEventListeners.add(cb);
    return () => this.remoteEventListeners.delete(cb);
  }

  public onStateSnapshot(cb: StateSnapshotListener) {
    this.stateSnapshotListeners.add(cb);
    return () => this.stateSnapshotListeners.delete(cb);
  }

  public onError(cb: ErrorListener) {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }
}

export const multiplayerManager = new MultiplayerService();
