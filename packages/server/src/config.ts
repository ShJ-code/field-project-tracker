/** Process configuration, read once from the environment with safe defaults. */
export interface AppConfig {
  port: number;
  dbPath: string;
  openMeteoBaseUrl: string;
  nominatimBaseUrl: string;
  /** Identifies this app to external APIs (weather, geocoding). */
  userAgent: string;
  webOrigin: string;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    dbPath: process.env.DB_PATH ?? './data/field-tracker.db',
    openMeteoBaseUrl:
      process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com',
    nominatimBaseUrl:
      process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
    // APP_USER_AGENT is preferred; GEOCODER_USER_AGENT kept for back-compat.
    userAgent:
      process.env.APP_USER_AGENT ??
      process.env.GEOCODER_USER_AGENT ??
      'field-project-tracker/0.1 (+https://github.com/ShJ-code/field-project-tracker)',
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  };
}
