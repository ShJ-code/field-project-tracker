import { randomUUID } from 'node:crypto';
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@field-tracker/shared';
import type { ProjectRepository } from '../ports/project-repository.js';
import { NotFoundError } from './errors.js';

/**
 * Application/domain service for the project lifecycle.
 *
 * Owns the rules: default status/priority, id and timestamp assignment,
 * normalization, and "exists or 404". Depends only on the repository *port*.
 */
export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  list(): Promise<Project[]> {
    return this.repository.findAll();
  }

  async get(id: string): Promise<Project> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project ${id} not found`);
    }
    return project;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      title: input.title.trim(),
      status: input.status ?? 'planned',
      priority: input.priority ?? 'medium',
      notes: input.notes?.trim() ?? '',
      dueDate: input.dueDate ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.create(project);
    return project;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const existing = await this.get(id);
    const updated: Project = {
      ...existing,
      ...pruneUndefined(input),
      updatedAt: new Date().toISOString(),
    };
    if (typeof updated.title === 'string') {
      updated.title = updated.title.trim();
    }
    await this.repository.update(updated);
    return updated;
  }

  async complete(id: string): Promise<Project> {
    const existing = await this.get(id);
    const updated: Project = {
      ...existing,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    await this.repository.update(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.get(id); // throws NotFoundError if it does not exist
    await this.repository.delete(id);
  }
}

/** Drop keys whose value is `undefined` so they don't overwrite existing data. */
function pruneUndefined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
