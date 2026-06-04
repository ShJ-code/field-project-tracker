import { Router } from 'express';
import { z } from 'zod';
import type { GeocodingService } from '../domain/geocoding-service.js';

const querySchema = z.object({
  q: z.string().min(1, 'q is required'),
});

/** Exposes address search: GET /api/geocode?q=<address>. */
export function createGeocodeRouter(geocoding: GeocodingService): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const { q } = querySchema.parse(req.query);
      res.json(await geocoding.search(q));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
