import { WebSocket } from 'ws';
import { createLogger } from './util/logger';

export function createSession(ws: WebSocket) {
  const log = createLogger();
  ws.on('message', (data) => {
    log.debug('session message', data.toString());
  });
}
