# Panel of Testers

This monorepo contains a minimal Manifest V3 Chrome extension and a Node.js server that work together to provide voice feedback on any open tab.

## Packages

- `panel-of-testers/extension` – MV3 extension using a background service worker, content script and offscreen document for audio playback.
- `panel-of-testers/server` – Express + WebSocket server that proxies Mistral AI and ElevenLabs.

## Development

```bash
pnpm install
pnpm build
```

Copy `.env.example` to `.env` and fill in API keys to run the server.
