/**
 * Isolated world — forwards page captures to the extension service worker.
 */
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== 'll-aikynetix-interceptor') return;

  if (data.type === 'LL_AIKYNETIX_RAW') {
    chrome.runtime.sendMessage({
      type: 'AIKYNETIX_RESPONSE',
      url: data.url,
      payload: data.payload,
    });
    return;
  }

  if (data.type === 'LL_AIKYNETIX_MEDIA') {
    chrome.runtime.sendMessage({
      type: 'AIKYNETIX_MEDIA',
      url: data.url,
    });
  }
});
