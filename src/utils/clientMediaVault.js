const DB_NAME = 'll_client_media_vault';
const STORE = 'movement_videos';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clientCode' });
      }
    };
  });
}

export async function saveClientVideo(clientCode, blob, meta = {}) {
  const db = await openDb();
  const record = {
    clientCode: String(clientCode),
    blob,
    mimeType: meta.mimeType || blob.type || 'video/mp4',
    fileName: meta.fileName || `${clientCode}_movement.mp4`,
    assessmentId: meta.assessmentId || '',
    sourceUrl: meta.sourceUrl || '',
    capturedAt: meta.capturedAt || new Date().toISOString(),
    size: blob.size || 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(record);
  });
}

export async function getClientVideoRecord(clientCode) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(String(clientCode));
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function hasClientVideo(clientCode) {
  const record = await getClientVideoRecord(clientCode);
  return Boolean(record?.blob);
}

export async function deleteClientMedia(clientCode) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const request = tx.objectStore(STORE).delete(String(clientCode));
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function downloadClientVideoFile(clientCode, fileName) {
  const record = await getClientVideoRecord(clientCode);
  if (!record?.blob) return false;

  const url = URL.createObjectURL(record.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || record.fileName || `${clientCode}_movement.mp4`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}
