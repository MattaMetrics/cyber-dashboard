/**
 * Relays extension background messages into the dashboard React app via postMessage.
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'AIKYNETIX_CAPTURE') {
    window.postMessage(
      {
        type: 'LL_AIKYNETIX_CAPTURE',
        source: 'll-dashboard-bridge',
        assessment_id: message.assessment_id,
        status: message.status,
        results: message.results,
        error: message.error,
      },
      window.location.origin
    );
    return;
  }

  if (message?.type === 'AIKYNETIX_MEDIA') {
    window.postMessage(
      {
        type: 'LL_AIKYNETIX_MEDIA',
        source: 'll-dashboard-bridge',
        video_url: message.video_url,
        client_id: message.client_id,
      },
      window.location.origin
    );
  }
});
