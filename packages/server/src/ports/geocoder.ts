import type { GeocodeResult } from '@field-tracker/shared';

/**
 * Port: the boundary to whatever geocoding service turns a free-text address
 * into coordinates. The domain depends on this interface and on the normalized
 * {@link GeocodeResult}, not on any provider's response shape.
 */
export interface Geocoder {
  search(query: string): Promise<GeocodeResult[]>;
}
