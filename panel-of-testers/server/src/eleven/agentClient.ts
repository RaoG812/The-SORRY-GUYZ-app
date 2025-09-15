import WebSocket from 'ws';

export function connect(agentId: string, apiKey: string) {
  const url = `wss://api.elevenlabs.io/agents/${agentId}`;
  const ws = new WebSocket(url, {
    headers: { 'xi-api-key': apiKey }
  });
  return ws;
}
