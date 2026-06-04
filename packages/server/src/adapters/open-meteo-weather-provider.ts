import type { WeatherSnapshot } from '@field-tracker/shared';
import type { WeatherProvider } from '../ports/weather-provider.js';

/** Minimal shape of the Open-Meteo `current` response we rely on. */
interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

/**
 * Adapter: fetches live conditions from Open-Meteo and normalizes them into a
 * provider-agnostic {@link WeatherSnapshot}.
 *
 * `fetchFn` is injected so tests can supply a stub — the same dependency-
 * inversion idea as the repository, applied to an HTTP call.
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async getCurrent(latitude: number, longitude: number): Promise<WeatherSnapshot> {
    const url = new URL('/v1/forecast', this.baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set(
      'current',
      'temperature_2m,precipitation,weather_code,wind_speed_10m',
    );
    url.searchParams.set('wind_speed_unit', 'kmh');

    const response = await this.fetchFn(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    if (!data.current) {
      throw new Error('Open-Meteo response did not include current conditions');
    }

    const c = data.current;
    return {
      temperatureC: c.temperature_2m,
      windSpeedKmh: c.wind_speed_10m,
      precipitationMm: c.precipitation,
      weatherCode: c.weather_code,
      description: describeWeatherCode(c.weather_code),
      observedAt: c.time,
    };
  }
}

/** Human-readable text for WMO weather interpretation codes. */
export function describeWeatherCode(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return map[code] ?? 'Unknown';
}
