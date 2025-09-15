const SERVER_URL = process.env.SERVER_PUBLIC_URL || 'http://localhost:8787';

async function ensureOffscreen() {
  // @ts-ignore Chrome type may not include hasDocument yet
  const exists = await chrome.offscreen.hasDocument?.();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'play TTS audio'
    });
  }
}

async function sendImage(image: string) {
  await fetch(`${SERVER_URL}/static`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image })
  });
}

async function captureStatic() {
  const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
  await ensureOffscreen();
  await sendImage(dataUrl);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'capture-static') {
    captureStatic();
  }
});
