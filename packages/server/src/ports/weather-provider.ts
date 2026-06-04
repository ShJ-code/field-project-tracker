import type { WeatherSnapshot } from '@field-tracker/shared';

/**
 * Port: the boundary to whatever external weather service we use.
 *
 * The domain depends on this interface and on the normalized
 * {@link WeatherSnapshot}, not on Open-Meteo's request/response shape. Swapping
 * to another provider means writing a new adapter that implements this port.
 */
export interface WeatherProvider {
  getCurrent(latitude: number, longitude: number): Promise<WeatherSnapshot>;
}
