import { describe, expect, it, vi } from 'vitest';
import type { GeocodeResult } from '@field-tracker/shared';
import { GeocodingService } from '../src/domain/geocoding-service.js';
import type { Geocoder } from '../src/ports/geocoder.js';

const match: GeocodeResult = { label: 'Somewhere', latitude: 1, longitude: 2 };

function fakeGeocoder(results: GeocodeResult[] = [match]): Geocoder {
  return { search: vi.fn(async () => results) };
}

describe('GeocodingService', () => {
  it('returns nothing for short queries without calling the geocoder', async () => {
    const geocoder = fakeGeocoder();
    const service = new GeocodingService(geocoder);
    expect(await service.search('ab')).toEqual([]);
    expect(geocoder.search).not.toHaveBeenCalled();
  });

  it('ignores surrounding whitespace when measuring length', async () => {
    const geocoder = fakeGeocoder();
    const service = new GeocodingService(geocoder);
    expect(await service.search('   a   ')).toEqual([]);
    expect(geocoder.search).not.toHaveBeenCalled();
  });

  it('trims and delegates valid queries', async () => {
    const geocoder = fakeGeocoder();
    const service = new GeocodingService(geocoder);
    const results = await service.search('  Pittsburgh  ');
    expect(results).toEqual([match]);
    expect(geocoder.search).toHaveBeenCalledWith('Pittsburgh');
  });
});
