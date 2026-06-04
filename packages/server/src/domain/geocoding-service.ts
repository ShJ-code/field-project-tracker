import type { GeocodeResult } from '@field-tracker/shared';
import type { Geocoder } from '../ports/geocoder.js';

/** Shortest query we bother sending to the geocoder. */
export const MIN_QUERY_LENGTH = 3;

/**
 * Wraps the geocoder port with the app's rule for what's worth searching:
 * trim the query and ignore anything too short to produce useful matches.
 */
export class GeocodingService {
  constructor(private readonly geocoder: Geocoder) {}

  async search(query: string): Promise<GeocodeResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }
    return this.geocoder.search(trimmed);
  }
}
