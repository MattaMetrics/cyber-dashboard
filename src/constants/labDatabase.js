/** Persistent longevity lab client dossier vault (localStorage + optional Supabase uplink). */
export const LAB_LS_DB = 'longevity_lab_db';

/** Safely read the persisted client database object. */
export function readPersistedLabDatabase() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LAB_LS_DB);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Bake the full client matrix back into terminal storage. */
export function writePersistedLabDatabase(database) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LAB_LS_DB, JSON.stringify(database || {}));
  } catch {
    /* storage may be blocked / quota exceeded */
  }
}

/** Merge seed CLIENT_DATABASE with any persisted coach / photo overrides. */
export function hydrateLabDatabase(seedDatabase = {}) {
  const persisted = readPersistedLabDatabase();
  if (!persisted) return { ...seedDatabase };

  const merged = { ...seedDatabase };
  Object.entries(persisted).forEach(([code, profile]) => {
    if (!profile || typeof profile !== 'object') return;
    merged[code] = merged[code] ? { ...merged[code], ...profile } : { ...profile };
  });
  return merged;
}

/**
 * 🟢 PERMANENTLY SECURE cloud vault uplink —
 * stays locked across networks, devices, and private tabs when Supabase env is configured.
 */
export async function broadcastClientMatrixToCloud(athleteCode, updatedData = {}) {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_ATHLETES_URL ||
    (import.meta.env.VITE_SUPABASE_URL
      ? `${String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '')}/rest/v1/athletes`
      : '');
  const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!athleteCode) return false;

  if (!SUPABASE_URL || !API_KEY) {
    console.warn(
      '[ PROTOCOL_0X-BA: CLOUD VAULT NOT CONFIGURED // SET VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ]'
    );
    return false;
  }

  console.log(
    `[ PROTOCOL_0X-BA: INJECTING DATA PACKET TO CLOUD VAULT FOR ${athleteCode} ]`
  );

  try {
    const response = await fetch(
      `${SUPABASE_URL}?access_code=eq.${encodeURIComponent(athleteCode)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: API_KEY,
          Authorization: `Bearer ${API_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          biometric_photo_url: updatedData.biometricPhotoUrl ?? updatedData.assessmentPhoto ?? '',
          execution_text: updatedData.execution ?? '',
          alignment_text: updatedData.alignment ?? '',
          pipeline_status: updatedData.status ?? updatedData.streamStatus ?? '',
          waiver_signed: updatedData.waiverSigned ?? updatedData.waiver_signed ?? null,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (response.ok) {
      console.log('[ 🟢 CLOUD TRANSACTION SUCCESSFUL: ENGINE CALIBRATED ]');
      return true;
    }

    console.error(
      `[ 🔴 CLOUD TRANSACTION REJECTED: ${response.status} ${response.statusText} ]`
    );
    return false;
  } catch (error) {
    console.error(`[ 🔴 DATABASE RE-ROUTING EXCEPTION ]: ${error.message}`);
    return false;
  }
}

/**
 * Dashboard save routine — local vault cache + permanent Supabase cloud broadcast.
 * Replaces legacy per-key `client_${athleteCode}` localStorage saves.
 */
export function saveClientRecord(athleteCode, updatedData = {}) {
  if (!athleteCode) return false;

  try {
    const currentDatabase = readPersistedLabDatabase() || {};
    currentDatabase[athleteCode] = {
      ...(currentDatabase[athleteCode] || {}),
      ...updatedData,
    };
    writePersistedLabDatabase(currentDatabase);
    console.log('[ LOCALCACHE SYNC COMPLETED ]');

    // Fire-and-forget permanent cloud uplink
    void broadcastClientMatrixToCloud(athleteCode, currentDatabase[athleteCode]);
    return true;
  } catch (error) {
    console.error(`[ CLIENT RECORD SAVE FAULT ]: ${error?.message || error}`);
    return false;
  }
}

/**
 * Persistent profile photo vector sync —
 * updates biometricPhotoUrl locally and broadcasts to the cloud vault.
 */
export function saveAthletePhotoVector(athleteCode, newImageUrl) {
  if (!athleteCode) return false;

  try {
    const currentDatabase = readPersistedLabDatabase() || {};

    if (!currentDatabase[athleteCode]) {
      currentDatabase[athleteCode] = {};
    }

    currentDatabase[athleteCode] = {
      ...currentDatabase[athleteCode],
      biometricPhotoUrl: newImageUrl,
      assessmentPhoto: newImageUrl,
    };

    writePersistedLabDatabase(currentDatabase);
    console.log(
      `[ 🟢 DATABASE PROFILES SYNCED: PHOTO VECTOR LOCKED FOR CODE ${athleteCode} ]`
    );

    void broadcastClientMatrixToCloud(athleteCode, currentDatabase[athleteCode]);
    return true;
  } catch (error) {
    console.error(`[ PHOTO VECTOR SYNC FAULT ]: ${error?.message || error}`);
    return false;
  }
}

/** Purge the persisted dossier vault (hard session wipe). */
export function clearPersistedLabDatabase() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LAB_LS_DB);
  } catch {
    /* ignore */
  }
}
