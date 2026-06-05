import type {
  CreateProjectInput,
  GeocodeResult,
  Project,
  SiteWeather,
  UpdateProjectInput,
} from '@field-tracker/shared';
import type { ProjectGateway } from './project-gateway';

/**
 * Adapter: talks to the REST API over HTTP. This is the only frontend file that
 * knows about `fetch`, URLs, or status codes.
 */
export class HttpProjectGateway implements ProjectGateway {
  constructor(private readonly baseUrl: string) {}

  list(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  create(input: CreateProjectInput): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  complete(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}/complete`, {
      method: 'PATCH',
    });
  }

  remove(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  getWeather(id: string): Promise<SiteWeather> {
    return this.request<SiteWeather>(`/projects/${id}/weather`);
  }

  geocode(query: string): Promise<GeocodeResult[]> {
    return this.request<GeocodeResult[]>(
      `/geocode?q=${encodeURIComponent(query)}`,
    );
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!response.ok) {
      throw new Error(await this.readError(response));
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private async readError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: string };
      return body.error ?? `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  }
}
