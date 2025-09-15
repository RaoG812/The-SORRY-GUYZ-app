import express from 'express';
import { WebSocketServer } from 'ws';
import { createLogger } from './util/logger';

const log = createLogger();
const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '10mb' }));
app.post('/static', (req, res) => {
  log.info('received static screenshot', req.body?.image?.length);
  res.json({ ok: true });
});

const server = app.listen(port, () => {
  log.info(`listening on ${port}`);
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  log.info('ws connection');
  ws.on('message', (data) => {
    log.debug('ws message', data.toString());
  });
});
