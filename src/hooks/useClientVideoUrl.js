import { useCallback, useEffect, useState } from 'react';
import {
  resolveClientVideoObjectUrl,
  revokeClientVideoObjectUrl,
  clientHasMovementVideo,
  downloadMovementVideo,
} from '../utils/clientVideoService';

export default function useClientVideoUrl(clientCode, client) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const code = String(clientCode || '');

    async function load() {
      if (!code || !client) {
        setVideoUrl('');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = await resolveClientVideoObjectUrl(code, client);
        if (!cancelled) setVideoUrl(url);
      } catch {
        if (!cancelled) setVideoUrl('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      revokeClientVideoObjectUrl(code);
    };
  }, [clientCode, client]);

  const downloadVideo = useCallback(async () => {
    return downloadMovementVideo(clientCode, client);
  }, [clientCode, client]);

  return {
    videoUrl,
    loading,
    hasMovementVideo: clientHasMovementVideo(client),
    downloadVideo,
  };
}
