import { Router } from 'express';
import type { ProjectService } from '../domain/project-service.js';
import type { SiteWeatherService } from '../domain/site-weather-service.js';
import { createProjectSchema, updateProjectSchema } from './validation.js';

/**
 * Translates HTTP <-> domain calls. Knows about routes and status codes; knows
 * nothing about how projects are stored or where weather comes from. Async
 * handler errors are forwarded to the central error middleware via `next`.
 */
export function createProjectsRouter(
  projects: ProjectService,
  siteWeather: SiteWeatherService,
): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await projects.list());
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const input = createProjectSchema.parse(req.body);
      const created = await projects.create(input);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json(await projects.get(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const input = updateProjectSchema.parse(req.body);
      res.json(await projects.update(req.params.id, input));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/complete', async (req, res, next) => {
    try {
      res.json(await projects.complete(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await projects.remove(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/weather', async (req, res, next) => {
    try {
      res.json(await siteWeather.getForProject(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
