import { useCallback, useState } from 'react';
import type { GeocodeResult } from '@field-tracker/shared';
import { useGateway } from './gateway-context';

export type GeocoderStatus = 'idle' | 'loading' | 'empty' | 'error';

/** Address search state + actions for the form. */
export function useGeocoder() {
  const gateway = useGateway();
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<GeocoderStatus>('idle');

  const search = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setResults([]);
        setStatus('idle');
        return;
      }
      setStatus('loading');
      try {
        const found = await gateway.geocode(query);
        setResults(found);
        setStatus(found.length > 0 ? 'idle' : 'empty');
      } catch {
        setResults([]);
        setStatus('error');
      }
    },
    [gateway],
  );

  const clear = useCallback(() => {
    setResults([]);
    setStatus('idle');
  }, []);

  return { results, status, search, clear };
}
