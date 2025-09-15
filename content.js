// content.js
(() => {
  // Shadow DOM panel
  const host = document.createElement('div');
  host.id = 'pot-panel-host';
  Object.assign(host.style, { position:'fixed', top:'12px', right:'12px', zIndex: 999999 });
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      .card{font:12px/1.4 Inter,system-ui;background:#111;color:#fff;border-radius:10px;padding:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);width:260px}
      .row{display:flex;gap:6px;align-items:center;margin:6px 0}
      button{all:unset;background:#2b2b2b;padding:6px 10px;border-radius:8px;cursor:pointer}
      button.primary{background:#4f46e5}
      select, input[type=checkbox]{background:#222;color:#fff;border:1px solid #333;border-radius:6px;padding:4px}
      .plan{background:#0f172a;border-radius:8px;padding:8px;max-height:120px;overflow:auto;margin-top:8px;font-size:11px;white-space:pre-wrap}
    </style>
    <div class="card">
      <div class="row">
        <label>Mode</label>
        <select id="mode">
          <option value="static">Static Image</option>
          <option value="flow">Event Flow (5s)</option>
          <option value="live">LIVE (30s)</option>
        </select>
      </div>
      <div class="row">
        <label><input id="mcp" type="checkbox"/> MCP plan</label>
      </div>
      <div class="row">
        <button id="start" class="primary">Start</button>
        <button id="stop">Stop</button>
      </div>
      <div class="plan" id="plan">Brief plan will appear here…</div>
    </div>
  `;

  const modeSel = root.getElementById('mode');
  const startBtn = root.getElementById('start');
  const stopBtn  = root.getElementById('stop');
  const planEl   = root.getElementById('plan');
  const mcpChk   = root.getElementById('mcp');

  // lightweight DOM/event telemetry
  const telemetry = [];
  let running = false;

  function record(evt, extra={}) {
    telemetry.push({ t: performance.now(), evt, ...extra });
    // throttle postMessage to background if live
    window.postMessage({ __POT_EVENT__: true, payload: { evt, extra, ts: Date.now() } }, "*");
  }

  // attach listeners
  ['click', 'input', 'keydown'].forEach(type => {
    document.addEventListener(type, e => {
      if (!running) return;
      const target = e.target && (e.target.name || e.target.id || e.target.tagName);
      record(type, { target, key: e.key, x: e.clientX, y: e.clientY });
    }, { capture: true });
  });

  // CLS/LCP basic signals
  new PerformanceObserver(list => {
    if (!running) return;
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
        record('cls', { value: entry.value });
      }
    });
  }).observe({ type: 'layout-shift', buffered: true });

  new PerformanceObserver(list => {
    if (!running) return;
    list.getEntries().forEach(entry => {
      if (entry.name === 'largest-contentful-paint') {
        record('lcp', { value: entry.startTime });
      }
    });
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  startBtn.onclick = () => {
    running = true;
    chrome.runtime.sendMessage({
      type: 'POT_START',
      mode: modeSel.value,
      wantMCP: mcpChk.checked
    });
  };

  stopBtn.onclick = () => {
    running = false;
    chrome.runtime.sendMessage({ type: 'POT_STOP' });
  };

  // receive brief plan from background/AI and render
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (msg && msg.__POT_PLAN__) {
      planEl.textContent = msg.text;
    }
  });
})();
