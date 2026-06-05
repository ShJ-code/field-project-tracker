import type { GeocodeResult } from '@field-tracker/shared';
import { UpstreamError } from '../domain/errors.js';
import type { Geocoder } from '../ports/geocoder.js';

/** Minimal shape of a Nominatim search result we rely on. */
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Adapter: geocodes via OpenStreetMap's Nominatim service and normalizes the
 * response into {@link GeocodeResult}. The only file that knows Nominatim's URL
 * and payload exist.
 *
 * Nominatim's usage policy requires an identifying User-Agent and limits volume
 * to ~1 request/second, which suits this app's interactive, low-traffic use.
 * `fetchFn` is injected so tests can stub the network call.
 */
export class NominatimGeocoder implements Geocoder {
  constructor(
    private readonly baseUrl: string,
    private readonly userAgent: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async search(query: string): Promise<GeocodeResult[]> {
    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '0');

    const response = await this.fetchFn(url.toString(), {
      headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new UpstreamError(
        `Nominatim request failed with status ${response.status}`,
        response.status,
      );
    }

    const results = (await response.json()) as NominatimResult[];
    return results
      .map((r) => ({
        label: r.display_name,
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      }))
      .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
  }
}
