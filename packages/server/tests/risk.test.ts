import { describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from '@field-tracker/shared';
import { computeSiteRisk } from '../src/domain/risk.js';

function weather(overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    temperatureC: 20,
    windSpeedKmh: 10,
    precipitationMm: 0,
    weatherCode: 1,
    description: 'Mainly clear',
    observedAt: '2026-06-04T12:00',
    ...overrides,
  };
}

describe('computeSiteRisk', () => {
  it('returns low risk with no factors for benign weather', () => {
    const risk = computeSiteRisk(weather());
    expect(risk.level).toBe('low');
    expect(risk.factors).toHaveLength(0);
  });

  it('flags high wind as elevated', () => {
    const risk = computeSiteRisk(weather({ windSpeedKmh: 55 }));
    expect(risk.level).toBe('elevated');
    expect(risk.factors.map((f) => f.code)).toContain('wind');
  });

  it('flags extreme heat as high', () => {
    const risk = computeSiteRisk(weather({ temperatureC: 38 }));
    expect(risk.level).toBe('high');
    expect(risk.factors.map((f) => f.code)).toContain('heat');
  });

  it('flags thunderstorm codes as high', () => {
    const risk = computeSiteRisk(weather({ weatherCode: 95 }));
    expect(risk.level).toBe('high');
    expect(risk.factors.map((f) => f.code)).toContain('storm');
  });

  it('flags freezing temperatures', () => {
    const risk = computeSiteRisk(weather({ temperatureC: -3 }));
    expect(risk.factors.map((f) => f.code)).toContain('freeze');
  });

  it('can report multiple factors at once', () => {
    const risk = computeSiteRisk(
      weather({ temperatureC: 39, windSpeedKmh: 50, precipitationMm: 12 }),
    );
    expect(risk.level).toBe('high');
    expect(risk.factors.map((f) => f.code).sort()).toEqual([
      'heat',
      'rain',
      'wind',
    ]);
  });
});
