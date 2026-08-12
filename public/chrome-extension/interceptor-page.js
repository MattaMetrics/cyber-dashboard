/**
 * MAIN world — patches fetch/XHR on Aikynetix pages (no chrome.* APIs here).
 */
(function interceptAikynetixNetwork() {
  if (window.__LL_AIKYNETIX_INTERCEPTOR__) return;
  window.__LL_AIKYNETIX_INTERCEPTOR__ = true;

  const CAPTURE_HINTS = [/analyze/i, /analysis/i, /biomechanical/i, /assessment/i, /\/api\//i];
  const MEDIA_HINTS = [/video/i, /media/i, /upload/i, /asset/i, /stream/i, /\.mp4/i, /recording/i];
  const VIDEO_BLOCKLIST = /manual_paste|aikynetix\.com\/(?:app|analysis)(?:\/|$)/i;

  function looksLikeVideoUrl(raw) {
    const url = String(raw || '').trim();
    if (!url) return false;
    if (VIDEO_BLOCKLIST.test(url)) return false;
    if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)) return true;
    if (/^(blob:|data:video)/i.test(url)) return true;
    if (/cloudfront\.net|amazonaws\.com|googleusercontent\.com|dropbox\.com|drive\.google\.com/i.test(url)) {
      return true;
    }
    return /^https?:\/\//i.test(url) && MEDIA_HINTS.some((pattern) => pattern.test(url));
  }

  function shouldCapture(url) {
    return CAPTURE_HINTS.some((pattern) => pattern.test(String(url || '')));
  }

  function shouldCaptureMedia(url) {
    const target = String(url || '');
    return MEDIA_HINTS.some((pattern) => pattern.test(target));
  }

  function looksLikeBiomechanicalPayload(data) {
    if (!data || typeof data !== 'object') return false;
    return Boolean(
      data.keypoints ||
        data.angles ||
        data.center_of_mass ||
        data.symmetry ||
        data.temporal ||
        data.results ||
        data.joint_angles
    );
  }

  function extractVideoUrlFromObject(data, depth = 0) {
    if (!data || depth > 5) return '';
    if (typeof data === 'string') {
      return looksLikeVideoUrl(data) ? data.trim() : '';
    }
    if (typeof data !== 'object') return '';

    const priorityKeys = [
      'video_url',
      'videoUrl',
      'media_url',
      'stream_url',
      'recording_url',
      'video',
      'mp4_url',
      'source_video',
    ];
    for (const key of priorityKeys) {
      const val = data[key];
      if (typeof val === 'string' && looksLikeVideoUrl(val)) return val.trim();
    }

    for (const [key, val] of Object.entries(data)) {
      if (!/video|mp4|media|stream|reel|clip|recording/i.test(key)) continue;
      if (typeof val === 'string' && looksLikeVideoUrl(val)) return val.trim();
    }

    for (const val of Object.values(data)) {
      const nested = extractVideoUrlFromObject(val, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  function relayMedia(url) {
    const clean = String(url || '').trim();
    if (!looksLikeVideoUrl(clean)) return;
    window.postMessage(
      {
        type: 'LL_AIKYNETIX_MEDIA',
        source: 'll-aikynetix-interceptor',
        url: clean,
      },
      '*'
    );
  }

  function relayCapture(url, payload) {
    const mediaUrl = extractVideoUrlFromObject(payload);
    if (mediaUrl) relayMedia(mediaUrl);

    if (!looksLikeBiomechanicalPayload(payload)) return;
    window.postMessage(
      {
        type: 'LL_AIKYNETIX_RAW',
        source: 'll-aikynetix-interceptor',
        url,
        payload,
      },
      '*'
    );
  }

  function scanVideoElements() {
    document.querySelectorAll('video[src], video source[src]').forEach((el) => {
      const src = el.currentSrc || el.src || el.getAttribute('src') || '';
      if (looksLikeVideoUrl(src)) relayMedia(src);
    });
  }

  const originalFetch = window.fetch;
  window.fetch = async function patchedFetch(...args) {
    const response = await originalFetch.apply(this, args);
    const request = args[0];
    const url =
      typeof request === 'string' ? request : request?.url ? String(request.url) : '';

    if (response.ok) {
      try {
        const clone = response.clone();
        const contentType = clone.headers.get('content-type') || '';

        if (contentType.includes('video') || (shouldCaptureMedia(url) && looksLikeVideoUrl(url))) {
          relayMedia(url);
        }

        if (shouldCapture(url) && contentType.includes('json')) {
          relayCapture(url, await clone.json());
        } else if (contentType.includes('json') && shouldCaptureMedia(url)) {
          const json = await clone.json();
          relayCapture(url, json);
        }
      } catch (_) {
        /* ignore */
      }
    }
    return response;
  };

  const XHROpen = XMLHttpRequest.prototype.open;
  const XHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    this.__llCaptureUrl = url;
    return XHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function patchedSend(...args) {
    this.addEventListener('load', function onLoad() {
      const url = this.__llCaptureUrl || '';
      if (this.status < 200 || this.status >= 300) return;

      if (shouldCaptureMedia(url) && looksLikeVideoUrl(url)) {
        relayMedia(url);
        return;
      }

      if (!shouldCapture(url)) return;
      try {
        relayCapture(url, JSON.parse(this.responseText));
      } catch (_) {
        /* ignore */
      }
    });
    return XHRSend.apply(this, args);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanVideoElements);
  } else {
    scanVideoElements();
  }

  const observer = new MutationObserver(() => scanVideoElements());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(scanVideoElements, 2500);
})();
