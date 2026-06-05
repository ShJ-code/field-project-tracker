import type {
  CreateProjectInput,
  GeocodeResult,
  Project,
  SiteWeather,
  UpdateProjectInput,
} from '@field-tracker/shared';

/**
 * Port: the frontend's view of the backend. UI and hooks depend on this
 * interface, not on `fetch` or any specific URL scheme — the mirror image of
 * the server's repository port.
 */
export interface ProjectGateway {
  list(): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  complete(id: string): Promise<Project>;
  remove(id: string): Promise<void>;
  getWeather(id: string): Promise<SiteWeather>;
  geocode(query: string): Promise<GeocodeResult[]>;
}
