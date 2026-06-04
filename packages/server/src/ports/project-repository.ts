import type { Project } from '@field-tracker/shared';

/**
 * Port: persistence boundary for projects.
 *
 * The domain depends on this interface, never on a concrete database. The
 * methods are async so an adapter can be backed by a remote store (e.g.
 * Postgres) without changing the domain — even though our SQLite adapter
 * happens to be synchronous underneath.
 */
export interface ProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
