function createModal() {
  const modal = document.createElement('div');
  modal.id = 'panel-of-testers-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    background: 'white',
    padding: '8px',
    border: '1px solid #ccc',
    zIndex: '9999'
  });
  modal.textContent = 'Panel ready';
  document.body.appendChild(modal);
}

createModal();

chrome.runtime.sendMessage({ type: 'capture-static' });
