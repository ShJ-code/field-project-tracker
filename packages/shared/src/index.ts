/**
 * Shared contract between the server and the web app.
 *
 * This is the single source of truth for the data that crosses the API seam.
 * It deliberately contains *only* types and small constant lists — no logic,
 * no dependencies — so both sides can depend on it without depending on each
 * other.
 */

// --- Project ---------------------------------------------------------------

export const PROJECT_STATUSES = [
  'planned',
  'in_progress',
  'blocked',
  'completed',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  priority: Priority;
  notes: string;
  /** ISO date (YYYY-MM-DD) or null when no due date is set. */
  dueDate: string | null;
  latitude: number;
  longitude: number;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;
}

/** Fields accepted when creating a project. */
export interface CreateProjectInput {
  title: string;
  status?: ProjectStatus;
  priority?: Priority;
  notes?: string;
  dueDate?: string | null;
  latitude: number;
  longitude: number;
}

/** Fields accepted when updating a project (all optional). */
export type UpdateProjectInput = Partial<CreateProjectInput>;

// --- Weather & Site Risk ---------------------------------------------------

/** Normalized weather reading, provider-agnostic. */
export interface WeatherSnapshot {
  temperatureC: number;
  windSpeedKmh: number;
  precipitationMm: number;
  /** WMO weather interpretation code. */
  weatherCode: number;
  description: string;
  /** ISO timestamp of the observation. */
  observedAt: string;
}

export const RISK_LEVELS = ['low', 'elevated', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** A single reason a site is flagged (e.g. high wind). */
export interface RiskFactor {
  code: 'heat' | 'freeze' | 'wind' | 'storm' | 'rain';
  label: string;
  detail: string;
}

export interface SiteRisk {
  level: RiskLevel;
  factors: RiskFactor[];
}

/** Weather + computed risk for one project's location. */
export interface SiteWeather {
  projectId: string;
  latitude: number;
  longitude: number;
  current: WeatherSnapshot;
  risk: SiteRisk;
}

// --- API error shape -------------------------------------------------------

export interface ApiError {
  error: string;
  details?: unknown;
}
