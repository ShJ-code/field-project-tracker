import { describe, expect, it, vi } from 'vitest';
import { NominatimGeocoder } from '../src/adapters/nominatim-geocoder.js';

function stubFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn(async () =>
    ({ ok, status, json: async () => payload }) as Response,
  ) as unknown as typeof fetch;
}

const sample = [
  {
    lat: '40.7484',
    lon: '-73.9857',
    display_name: 'Empire State Building, NYC',
  },
];

describe('NominatimGeocoder', () => {
  it('normalizes results into GeocodeResult[]', async () => {
    const geocoder = new NominatimGeocoder(
      'https://geo.test',
      'ua/1.0',
      stubFetch(sample),
    );
    const results = await geocoder.search('empire state building');
    expect(results).toEqual([
      { label: 'Empire State Building, NYC', latitude: 40.7484, longitude: -73.9857 },
    ]);
  });

  it('sends the query and an identifying User-Agent', async () => {
    const fetchFn = stubFetch(sample);
    const geocoder = new NominatimGeocoder('https://geo.test', 'ua/1.0', fetchFn);
    await geocoder.search('1600 Pennsylvania Ave');

    const mock = fetchFn as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = mock.mock.calls[0];
    expect(url).toContain('/search');
    expect(url).toContain('q=1600+Pennsylvania+Ave');
    expect(url).toContain('format=jsonv2');
    expect((init as RequestInit).headers).toMatchObject({ 'User-Agent': 'ua/1.0' });
  });

  it('drops results with non-numeric coordinates', async () => {
    const geocoder = new NominatimGeocoder(
      'https://geo.test',
      'ua/1.0',
      stubFetch([{ lat: 'NaN', lon: '1', display_name: 'bad' }]),
    );
    expect(await geocoder.search('somewhere')).toEqual([]);
  });

  it('throws when the response is not ok', async () => {
    const geocoder = new NominatimGeocoder(
      'https://geo.test',
      'ua/1.0',
      stubFetch([], false, 429),
    );
    await expect(geocoder.search('x')).rejects.toThrow(/429/);
  });
});
