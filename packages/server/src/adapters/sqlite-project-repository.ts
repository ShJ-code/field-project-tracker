import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Project, Priority, ProjectStatus } from '@field-tracker/shared';
import type { ProjectRepository } from '../ports/project-repository.js';

/** Database row shape (snake_case columns). */
interface ProjectRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  notes: string;
  due_date: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

/**
 * Adapter: SQLite-backed {@link ProjectRepository}.
 *
 * This is the only file that knows the database exists. It also owns the
 * mapping between the persistence row shape and the domain {@link Project}.
 */
export class SqliteProjectRepository implements ProjectRepository {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        status     TEXT NOT NULL,
        priority   TEXT NOT NULL,
        notes      TEXT NOT NULL DEFAULT '',
        due_date   TEXT,
        latitude   REAL NOT NULL,
        longitude  REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  async findAll(): Promise<Project[]> {
    // rowid (insertion order) breaks ties when two rows share a timestamp,
    // keeping "newest first" deterministic.
    const rows = this.db
      .prepare('SELECT * FROM projects ORDER BY created_at DESC, rowid DESC')
      .all() as ProjectRow[];
    return rows.map(rowToProject);
  }

  async findById(id: string): Promise<Project | null> {
    const row = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as ProjectRow | undefined;
    return row ? rowToProject(row) : null;
  }

  async create(project: Project): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO projects
           (id, title, status, priority, notes, due_date, latitude, longitude, created_at, updated_at)
         VALUES
           (@id, @title, @status, @priority, @notes, @due_date, @latitude, @longitude, @created_at, @updated_at)`,
      )
      .run(projectToRow(project));
  }

  async update(project: Project): Promise<void> {
    this.db
      .prepare(
        `UPDATE projects SET
           title = @title,
           status = @status,
           priority = @priority,
           notes = @notes,
           due_date = @due_date,
           latitude = @latitude,
           longitude = @longitude,
           updated_at = @updated_at
         WHERE id = @id`,
      )
      .run(projectToRow(project));
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    status: row.status as ProjectStatus,
    priority: row.priority as Priority,
    notes: row.notes,
    dueDate: row.due_date,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(project: Project): ProjectRow {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    priority: project.priority,
    notes: project.notes,
    due_date: project.dueDate,
    latitude: project.latitude,
    longitude: project.longitude,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}
