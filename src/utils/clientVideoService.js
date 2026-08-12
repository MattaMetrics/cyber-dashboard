import {
  saveClientVideo,
  getClientVideoRecord,
  deleteClientMedia,
  downloadClientVideoFile,
  hasClientVideo,
} from './clientMediaVault';
import {
  extractVideoUrlFromIntercept,
  isPlayableVideoSource,
  resolveClientVideoUrl,
} from './deepCyberPhaseParser';

const objectUrlCache = new Map();

export function revokeClientVideoObjectUrl(clientCode) {
  const key = String(clientCode);
  const url = objectUrlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(key);
  }
}

export async function resolveClientVideoObjectUrl(clientCode, client) {
  const code = String(clientCode);
  const stored = client?.longevityReport || {};

  if (stored.hasLocalVideo || stored.videoStorageKey) {
    const record = await getClientVideoRecord(code);
    if (record?.blob) {
      revokeClientVideoObjectUrl(code);
      const url = URL.createObjectURL(record.blob);
      objectUrlCache.set(code, url);
      return url;
    }
  }

  const external =
    (stored.videoUrl && isPlayableVideoSource(stored.videoUrl) ? stored.videoUrl : '') ||
    resolveClientVideoUrl(client);

  return external || '';
}

export function clientHasMovementVideo(client) {
  if (!client) return false;
  const stored = client.longevityReport || {};
  if (stored.hasLocalVideo || stored.videoStorageKey) return true;
  if (isPlayableVideoSource(stored.videoUrl)) return true;
  return isPlayableVideoSource(client.reportUrl);
}

export async function persistClientVideoFromUrl(clientCode, sourceUrl, meta = {}) {
  const url = String(sourceUrl || '').trim();
  if (!isPlayableVideoSource(url)) {
    return { stored: false, videoUrl: '', hasLocalVideo: false };
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (blob.size < 512) throw new Error('Payload too small');

    const mimeType = blob.type || 'video/mp4';
    await saveClientVideo(clientCode, blob, {
      ...meta,
      sourceUrl: url,
      mimeType,
      fileName: meta.fileName || `${clientCode}_movement.mp4`,
    });

    return {
      stored: true,
      hasLocalVideo: true,
      videoStorageKey: String(clientCode),
      videoUrl: url,
      videoCapturedAt: new Date().toISOString(),
    };
  } catch {
    return {
      stored: false,
      hasLocalVideo: false,
      videoStorageKey: '',
      videoUrl: url,
      videoCapturedAt: new Date().toISOString(),
    };
  }
}

export async function persistClientVideoFromResults(clientCode, results, client) {
  const sourceUrl =
    extractVideoUrlFromIntercept(results) ||
    (isPlayableVideoSource(client?.reportUrl) ? String(client.reportUrl).trim() : '');

  if (!sourceUrl) return { stored: false, hasLocalVideo: false, videoUrl: '' };
  return persistClientVideoFromUrl(clientCode, sourceUrl, {
    assessmentId: results?.assessment_id || '',
  });
}

function mergeVideoIntoLongevityReport(longevityReport, persistResult, playbackUrl) {
  const phases = (longevityReport.phases || []).map((phase) => ({
    ...phase,
    videoUrl: playbackUrl || persistResult.videoUrl || phase.videoUrl || '',
  }));

  let modelDataPhases = longevityReport.modelDataPhases;
  if (modelDataPhases && typeof modelDataPhases === 'object') {
    modelDataPhases = Object.fromEntries(
      Object.entries(modelDataPhases).map(([key, phase]) => [
        key,
        {
          ...phase,
          videoUrl: playbackUrl || persistResult.videoUrl || phase.videoUrl || '',
        },
      ])
    );
  }

  return {
    ...longevityReport,
    phases,
    modelDataPhases,
    videoUrl: persistResult.videoUrl || longevityReport.videoUrl || '',
    videoStorageKey: persistResult.stored ? String(persistResult.videoStorageKey) : '',
    hasLocalVideo: persistResult.stored,
    videoCapturedAt: persistResult.videoCapturedAt || longevityReport.videoCapturedAt,
  };
}

/** Fetch remote video into IndexedDB and merge pointers onto the client dossier */
export async function attachPersistedVideoToClient(client, clientCode, results) {
  const persistResult = await persistClientVideoFromResults(clientCode, results, client);
  if (!persistResult.videoUrl && !persistResult.stored) return client;

  const playbackUrl = persistResult.stored
    ? await resolveClientVideoObjectUrl(clientCode, {
        ...client,
        longevityReport: {
          ...(client.longevityReport || {}),
          hasLocalVideo: true,
          videoStorageKey: String(clientCode),
        },
      })
    : persistResult.videoUrl;

  const longevityReport = mergeVideoIntoLongevityReport(
    client.longevityReport || {},
    persistResult,
    playbackUrl
  );

  return {
    ...client,
    reportUrl: persistResult.videoUrl || client.reportUrl,
    streamStatus: client.streamStatus || 'STREAM CALIBRATED',
    longevityReport,
  };
}

/** Client cloud uplink — stage URL and persist blob when CORS allows */
export async function attachCloudVideoToClient(client, clientCode, rawUrl) {
  const persistResult = await persistClientVideoFromUrl(clientCode, rawUrl, {
    fileName: `${clientCode}_cloud_uplink.mp4`,
  });
  if (!persistResult.videoUrl && !persistResult.stored) return client;

  const playbackUrl = persistResult.stored
    ? await resolveClientVideoObjectUrl(clientCode, {
        ...client,
        longevityReport: {
          ...(client.longevityReport || {}),
          hasLocalVideo: true,
          videoStorageKey: String(clientCode),
        },
      })
    : persistResult.videoUrl;

  const longevityReport = mergeVideoIntoLongevityReport(
    client.longevityReport || {},
    persistResult,
    playbackUrl
  );

  return {
    ...client,
    reportUrl: persistResult.videoUrl,
    streamStatus: 'STREAM CALIBRATED',
    longevityReport,
  };
}

export async function purgeClientVideo(clientCode) {
  revokeClientVideoObjectUrl(clientCode);
  await deleteClientMedia(clientCode);
}

export async function downloadMovementVideo(clientCode, client) {
  const stored = await hasClientVideo(clientCode);
  if (stored) {
    const name = `${(client?.name || 'client').replace(/\s+/g, '_')}_movement.mp4`;
    return downloadClientVideoFile(clientCode, name);
  }

  const url = resolveClientVideoUrl(client);
  if (!url) return false;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('fetch failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${(client?.name || 'client').replace(/\s+/g, '_')}_movement.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
}
