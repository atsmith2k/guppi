import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class GuppiWebSocketServer {
  private wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });
  }

  public broadcast(type: string, payload: any) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
