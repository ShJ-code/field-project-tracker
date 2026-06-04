import type { RiskFactor, RiskLevel, SiteRisk, WeatherSnapshot } from '@field-tracker/shared';

/**
 * Business rules that turn a weather reading into a field-safety risk.
 *
 * These thresholds are the heart of the "site risk" feature, so they live in
 * the domain — not in the weather adapter. Changing what counts as risky is a
 * business decision, made here, independent of where the weather data comes
 * from.
 */
export const RISK_THRESHOLDS = {
  /** °C at or above which heat stress is flagged. */
  heatC: 35,
  /** °C at or below which freezing conditions are flagged. */
  freezeC: 0,
  /** km/h at or above which high wind is flagged. */
  windKmh: 40,
  /** mm of precipitation at or above which heavy rain is flagged. */
  rainMm: 10,
} as const;

/** WMO weather codes that indicate a thunderstorm. */
const THUNDERSTORM_CODES = new Set([95, 96, 99]);

export function computeSiteRisk(weather: WeatherSnapshot): SiteRisk {
  const factors: RiskFactor[] = [];

  if (weather.temperatureC >= RISK_THRESHOLDS.heatC) {
    factors.push({
      code: 'heat',
      label: 'Extreme heat',
      detail: `${Math.round(weather.temperatureC)}°C`,
    });
  }
  if (weather.temperatureC <= RISK_THRESHOLDS.freezeC) {
    factors.push({
      code: 'freeze',
      label: 'Freezing',
      detail: `${Math.round(weather.temperatureC)}°C`,
    });
  }
  if (weather.windSpeedKmh >= RISK_THRESHOLDS.windKmh) {
    factors.push({
      code: 'wind',
      label: 'High wind',
      detail: `${Math.round(weather.windSpeedKmh)} km/h`,
    });
  }
  if (THUNDERSTORM_CODES.has(weather.weatherCode)) {
    factors.push({
      code: 'storm',
      label: 'Thunderstorm',
      detail: weather.description,
    });
  }
  if (weather.precipitationMm >= RISK_THRESHOLDS.rainMm) {
    factors.push({
      code: 'rain',
      label: 'Heavy precipitation',
      detail: `${weather.precipitationMm} mm`,
    });
  }

  return { level: deriveLevel(factors), factors };
}

/** Storms and extreme heat are "high"; any other flag is "elevated". */
function deriveLevel(factors: RiskFactor[]): RiskLevel {
  if (factors.some((f) => f.code === 'storm' || f.code === 'heat')) {
    return 'high';
  }
  return factors.length > 0 ? 'elevated' : 'low';
}
