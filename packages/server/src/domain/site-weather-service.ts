import type { SiteWeather } from '@field-tracker/shared';
import type { ProjectRepository } from '../ports/project-repository.js';
import type { WeatherProvider } from '../ports/weather-provider.js';
import { NotFoundError } from './errors.js';
import { computeSiteRisk } from './risk.js';

/**
 * Combines a project's location with live weather to produce its site risk.
 * Depends only on the repository and weather *ports*.
 */
export class SiteWeatherService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly weather: WeatherProvider,
  ) {}

  async getForProject(projectId: string): Promise<SiteWeather> {
    const project = await this.repository.findById(projectId);
    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }
    const current = await this.weather.getCurrent(
      project.latitude,
      project.longitude,
    );
    return {
      projectId: project.id,
      latitude: project.latitude,
      longitude: project.longitude,
      current,
      risk: computeSiteRisk(current),
    };
  }
}
