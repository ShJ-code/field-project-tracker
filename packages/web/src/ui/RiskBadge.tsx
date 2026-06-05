import type { Project } from '@field-tracker/shared';
import { useSiteWeather } from '../app/use-site-weather';
import { labelize } from './format';

/**
 * Compact site-risk badge for a table row. Pulls live weather for the project's
 * location and shows the computed risk level; details are in the tooltip.
 */
export function RiskBadge({ project }: { project: Project }) {
  const { data, loading, error } = useSiteWeather(project);

  if (loading) {
    return <span className="risk risk--loading">…</span>;
  }
  if (error || !data) {
    return (
      <span className="risk risk--loading" title={error ?? 'Unavailable'}>
        n/a
      </span>
    );
  }

  const { level, factors } = data.risk;
  const { temperatureC, windSpeedKmh, description } = data.current;
  const hazards = factors.length
    ? factors.map((f) => `${f.label} (${f.detail})`).join(', ')
    : 'No active hazards';
  const tooltip = `${Math.round(temperatureC)}°C, ${description}, wind ${Math.round(
    windSpeedKmh,
  )} km/h — ${hazards}`;

  return (
    <span className={`risk risk--${level}`} title={tooltip}>
      {labelize(level)}
    </span>
  );
}
