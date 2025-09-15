const audio = new Audio();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'play-audio') {
    audio.src = msg.url;
    audio.play();
  }
});
