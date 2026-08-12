const DEFAULT_API_BASE = 'http://localhost:8000';

let activeSession = {
  test_id: 'LL001',
  client_id: 'COACH_INTERCEPT',
  client_age: 35,
  api_base: DEFAULT_API_BASE,
};

let lastMediaUrl = '';

async function loadSession() {
  const stored = await chrome.storage.local.get(['ll_active_session', 'll_last_media_url']);
  if (stored.ll_active_session) {
    activeSession = { ...activeSession, ...stored.ll_active_session };
  }
  if (stored.ll_last_media_url?.url) {
    lastMediaUrl = stored.ll_last_media_url.url;
  }
}

async function saveSession(session) {
  activeSession = { ...activeSession, ...session };
  await chrome.storage.local.set({ ll_active_session: activeSession });
}

function extractVideoUrlFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';

  const priority = [
    payload.video_url,
    payload.videoUrl,
    payload.media_url,
    payload.stream_url,
    payload.recording_url,
    payload.metadata?.video_url,
    payload.metadata?.media_url,
  ];

  for (const raw of priority) {
    const url = String(raw || '').trim();
    if (/\.(mp4|webm|mov|m4v)|blob:|video|media|stream|cloudfront|amazonaws/i.test(url)) {
      return url;
    }
  }

  return '';
}

async function notifyDashboardTabs(message) {
  const tabs = await chrome.tabs.query({
    url: ['http://localhost/*', 'http://127.0.0.1/*'],
  });

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (_) {
      /* dashboard-bridge not injected yet */
    }
  }
}

async function relayToLabApi(payload, sourceUrl, videoUrl) {
  await loadSession();
  const apiBase = activeSession.api_base || DEFAULT_API_BASE;
  const resolvedVideoUrl = videoUrl || extractVideoUrlFromPayload(payload) || lastMediaUrl || '';

  const response = await fetch(`${apiBase}/api/assess/intercept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      test_id: activeSession.test_id || 'LL001',
      client_id: activeSession.client_id || 'COACH_INTERCEPT',
      client_age: Number(activeSession.client_age) || 35,
      aikynetix_response: payload,
      source_url: sourceUrl || '',
      video_url: resolvedVideoUrl || null,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Intercept API failed (${response.status})`);
  }

  return response.json();
}

async function handleMediaCapture(url) {
  const clean = String(url || '').trim();
  if (!clean) return;

  lastMediaUrl = clean;
  await chrome.storage.local.set({
    ll_last_media_url: {
      url: clean,
      at: new Date().toISOString(),
      client_id: activeSession.client_id,
    },
  });

  await notifyDashboardTabs({
    type: 'AIKYNETIX_MEDIA',
    video_url: clean,
    client_id: activeSession.client_id,
  });
}

async function handleCapture(payload, sourceUrl) {
  try {
    const videoUrl = extractVideoUrlFromPayload(payload) || lastMediaUrl || '';
    const result = await relayToLabApi(payload, sourceUrl, videoUrl);

    if (videoUrl && result?.results) {
      result.results.video_url = videoUrl;
      result.results.metadata = {
        ...(result.results.metadata || {}),
        video_url: videoUrl,
      };
    }

    await notifyDashboardTabs({
      type: 'AIKYNETIX_CAPTURE',
      status: 'completed',
      ...result,
    });
    await chrome.storage.local.set({
      ll_last_capture: {
        at: new Date().toISOString(),
        assessment_id: result.assessment_id,
        source_url: sourceUrl,
        video_url: videoUrl,
      },
    });
  } catch (error) {
    await notifyDashboardTabs({
      type: 'AIKYNETIX_CAPTURE',
      status: 'failed',
      error: String(error.message || error),
    });
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type;

  if (type === 'REGISTER_SESSION') {
    saveSession({
      test_id: message.test_id,
      client_id: message.client_id,
      client_age: message.client_age,
      api_base: message.api_base || DEFAULT_API_BASE,
    }).then(() => sendResponse({ ok: true, session: activeSession }));
    return true;
  }

  if (type === 'GET_SESSION') {
    loadSession().then(() => sendResponse({ ok: true, session: activeSession }));
    return true;
  }

  if (type === 'AIKYNETIX_RESPONSE') {
    handleCapture(message.payload, message.url);
    sendResponse({ ok: true });
    return true;
  }

  if (type === 'AIKYNETIX_MEDIA') {
    handleMediaCapture(message.url);
    sendResponse({ ok: true });
    return true;
  }

  if (type === 'PING') {
    sendResponse({ ok: true, extension: 'll-aikynetix-interceptor' });
    return true;
  }

  return false;
});

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'REGISTER_SESSION') {
    saveSession(message).then(() => sendResponse({ ok: true, session: activeSession }));
    return true;
  }
  if (message?.type === 'PING') {
    sendResponse({ ok: true, extension: 'll-aikynetix-interceptor' });
    return true;
  }
  return false;
});

loadSession();
