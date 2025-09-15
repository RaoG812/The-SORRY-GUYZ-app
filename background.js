// background.js (module)
let session = null;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === 'POT_START') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    session = await startSession(tab.id, msg.mode, msg.wantMCP);
  }
  if (msg.type === 'POT_STOP') {
    await stopSession();
  }
});

async function startSession(tabId, mode, wantMCP) {
  const duration = mode === 'static' ? 3_000 : (mode === 'flow' ? 5_000 : 30_000);
  const captureOpts = mode === 'static' ? null : { audio: false, video: true };
  const endAt = Date.now() + duration;

  // ensure offscreen audio doc
  await ensureOffscreen();

  // open AI core WS (your server) — it fans out to LLM + ElevenLabs
  const aiWS = new WebSocket(`wss://YOUR_AI_CORE/session`, /* { headers if needed } */);

  // forward DOM events coming from content (via window.postMessage -> chrome.runtime.onMessageExternal is optional; simpler: use chrome.runtime.onMessage as relay)
  chrome.runtime.onMessage.addListener((innerMsg) => {
    if (innerMsg && innerMsg.__POT_EVENT_RELAY__) {
      aiWS.readyState === 1 && aiWS.send(JSON.stringify({ type: 'event', data: innerMsg.payload }));
    }
  });

  // listen to audio chunks from AI core (PCM/OGG/MP3) and forward to offscreen for playback
  aiWS.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'plan') {
      // bounce plan to page
      await chrome.tabs.sendMessage(tabId, { __POT_PLAN__: true, text: msg.text });
    }
    if (msg.type === 'audio_chunk') {
      await chrome.runtime.sendMessage({ __POT_AUDIO_CHUNK__: true, chunkBase64: msg.data, mime: msg.mime });
    }
  };

  // capture
  if (mode === 'static') {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
    aiWS.onopen = () => {
      aiWS.send(JSON.stringify({
        type: 'static_image',
        imageBase64: dataUrl.split(',')[1],
        wantMCP
      }));
    };
  } else {
    const stream = await chrome.tabCapture.capture({ video: true, audio: false });
    const video = new OffscreenVideo(stream); // helper (below)
    const tickMs = mode === 'flow' ? 250 : 300; // frame sampling
    const sampler = setInterval(async () => {
      if (Date.now() > endAt) return clearInterval(sampler);
      const frame = await video.captureFrame(); // Uint8Array (PNG/WebP)
      aiWS.readyState === 1 && aiWS.send(JSON.stringify({
        type: 'frame',
        ts: Date.now(),
        imageBase64: btoa(String.fromCharCode(...frame))
      }));
    }, tickMs);

    setTimeout(() => clearInterval(sampler), duration);
  }

  // auto-stop
  setTimeout(stopSession, duration + 500);
  return { mode, tabId, endAt, aiWS };
}

async function stopSession() {
  if (!session) return;
  try { session.aiWS && session.aiWS.close(); } catch {}
  session = null;
}

async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument?.();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Low-latency voice feedback playback'
    });
  }
}

// Helper: Offscreen video frame grabber using OffscreenCanvas
class OffscreenVideo {
  constructor(stream) {
    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.canvas = new OffscreenCanvas(960, 540);
    this.ctx = this.canvas.getContext('2d');
    this.ready = this.video.play();
  }
  async captureFrame() {
    await this.ready;
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const blob = await this.canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
    return new Uint8Array(await blob.arrayBuffer());
  }
}
