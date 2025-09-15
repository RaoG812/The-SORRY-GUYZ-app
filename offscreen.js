// offscreen.js
const ctx = new AudioContext();
let source, queue = [];

chrome.runtime.onMessage.addListener(async (msg) => {
  if (!msg.__POT_AUDIO_CHUNK__) return;
  const buf = Uint8Array.from(atob(msg.chunkBase64), c => c.charCodeAt(0));
  const audioBuf = await ctx.decodeAudioData(buf.buffer);
  playBuffer(audioBuf);
});

function playBuffer(audioBuffer) {
  const node = new AudioBufferSourceNode(ctx, { buffer: audioBuffer });
  node.connect(ctx.destination);
  node.start();
}
