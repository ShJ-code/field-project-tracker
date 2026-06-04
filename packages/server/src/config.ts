/** Process configuration, read once from the environment with safe defaults. */
export interface AppConfig {
  port: number;
  dbPath: string;
  openMeteoBaseUrl: string;
  webOrigin: string;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    dbPath: process.env.DB_PATH ?? './data/field-tracker.db',
    openMeteoBaseUrl:
      process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com',
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  };
}
