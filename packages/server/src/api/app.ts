import cors from 'cors';
import express, {
  type ErrorRequestHandler,
  type Express,
} from 'express';
import { ZodError } from 'zod';
import type { GeocodingService } from '../domain/geocoding-service.js';
import type { ProjectService } from '../domain/project-service.js';
import type { SiteWeatherService } from '../domain/site-weather-service.js';
import { NotFoundError } from '../domain/errors.js';
import { createGeocodeRouter } from './geocode-router.js';
import { createProjectsRouter } from './projects-router.js';

export interface AppDependencies {
  projectService: ProjectService;
  siteWeatherService: SiteWeatherService;
  geocodingService: GeocodingService;
  webOrigin: string;
}

/**
 * Builds the Express app from injected services. Taking dependencies as
 * arguments (rather than importing concrete adapters) is what lets tests and
 * the composition root wire in whatever implementation they need.
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.use(cors({ origin: deps.webOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/api/projects',
    createProjectsRouter(deps.projectService, deps.siteWeatherService),
  );
  app.use('/api/geocode', createGeocodeRouter(deps.geocodingService));

  app.use(errorHandler);
  return app;
}

/** Maps domain/validation errors to HTTP responses. */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.issues });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
