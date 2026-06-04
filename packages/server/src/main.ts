/**
 * Composition root: the one place that knows which concrete adapters exist.
 * It loads config, constructs adapters, injects them into the domain services,
 * builds the HTTP app, and starts listening. Nothing below this file depends on
 * anything above its own layer.
 */
import { NominatimGeocoder } from './adapters/nominatim-geocoder.js';
import { OpenMeteoWeatherProvider } from './adapters/open-meteo-weather-provider.js';
import { SqliteProjectRepository } from './adapters/sqlite-project-repository.js';
import { createApp } from './api/app.js';
import { loadConfig } from './config.js';
import { GeocodingService } from './domain/geocoding-service.js';
import { ProjectService } from './domain/project-service.js';
import { SiteWeatherService } from './domain/site-weather-service.js';

// Load a local .env if present (Node 22+); ignore if there isn't one.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables / defaults
}

const config = loadConfig();

const projectRepository = new SqliteProjectRepository(config.dbPath);
const weatherProvider = new OpenMeteoWeatherProvider(config.openMeteoBaseUrl);
const geocoder = new NominatimGeocoder(
  config.nominatimBaseUrl,
  config.geocoderUserAgent,
);

const projectService = new ProjectService(projectRepository);
const siteWeatherService = new SiteWeatherService(
  projectRepository,
  weatherProvider,
);
const geocodingService = new GeocodingService(geocoder);

const app = createApp({
  projectService,
  siteWeatherService,
  geocodingService,
  webOrigin: config.webOrigin,
});

app.listen(config.port, () => {
  console.log(`Field Tracker API listening on http://localhost:${config.port}`);
});
