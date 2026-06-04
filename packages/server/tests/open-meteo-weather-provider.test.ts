import { describe, expect, it, vi } from 'vitest';
import { OpenMeteoWeatherProvider } from '../src/adapters/open-meteo-weather-provider.js';

function stubFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn(async () =>
    ({
      ok,
      status,
      json: async () => payload,
    }) as Response,
  ) as unknown as typeof fetch;
}

describe('OpenMeteoWeatherProvider', () => {
  it('normalizes the Open-Meteo response into a WeatherSnapshot', async () => {
    const fetchFn = stubFetch({
      current: {
        time: '2026-06-04T12:00',
        temperature_2m: 31.4,
        precipitation: 0.2,
        weather_code: 95,
        wind_speed_10m: 18.3,
      },
    });
    const provider = new OpenMeteoWeatherProvider('https://example.test', fetchFn);

    const snapshot = await provider.getCurrent(40.69, -80.31);

    expect(snapshot).toEqual({
      temperatureC: 31.4,
      windSpeedKmh: 18.3,
      precipitationMm: 0.2,
      weatherCode: 95,
      description: 'Thunderstorm',
      observedAt: '2026-06-04T12:00',
    });
  });

  it('requests the configured coordinates and units', async () => {
    const fetchFn = stubFetch({
      current: {
        time: '2026-06-04T12:00',
        temperature_2m: 20,
        precipitation: 0,
        weather_code: 1,
        wind_speed_10m: 5,
      },
    });
    const provider = new OpenMeteoWeatherProvider('https://example.test', fetchFn);

    await provider.getCurrent(12.34, 56.78);

    const calledUrl = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('latitude=12.34');
    expect(calledUrl).toContain('longitude=56.78');
    expect(calledUrl).toContain('wind_speed_unit=kmh');
  });

  it('throws when the response is not ok', async () => {
    const provider = new OpenMeteoWeatherProvider(
      'https://example.test',
      stubFetch({}, false, 503),
    );
    await expect(provider.getCurrent(0, 0)).rejects.toThrow(/503/);
  });
});
