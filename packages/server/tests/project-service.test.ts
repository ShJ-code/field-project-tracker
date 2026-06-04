import { beforeEach, describe, expect, it } from 'vitest';
import { SqliteProjectRepository } from '../src/adapters/sqlite-project-repository.js';
import { ProjectService } from '../src/domain/project-service.js';
import { NotFoundError } from '../src/domain/errors.js';

function makeService(): ProjectService {
  // ':memory:' gives every test an isolated, throwaway database.
  return new ProjectService(new SqliteProjectRepository(':memory:'));
}

const baseInput = {
  title: 'Inspect substation',
  latitude: 40.69,
  longitude: -80.31,
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    service = makeService();
  });

  it('applies defaults and assigns id/timestamps on create', async () => {
    const project = await service.create(baseInput);
    expect(project.id).toMatch(/[0-9a-f-]{36}/);
    expect(project.status).toBe('planned');
    expect(project.priority).toBe('medium');
    expect(project.notes).toBe('');
    expect(project.dueDate).toBeNull();
    expect(project.createdAt).toBe(project.updatedAt);
  });

  it('trims the title', async () => {
    const project = await service.create({ ...baseInput, title: '  Survey  ' });
    expect(project.title).toBe('Survey');
  });

  it('lists projects newest-first', async () => {
    const a = await service.create({ ...baseInput, title: 'A' });
    const b = await service.create({ ...baseInput, title: 'B' });
    const list = await service.list();
    expect(list.map((p) => p.id)).toEqual([b.id, a.id]);
  });

  it('updates only provided fields and refreshes updatedAt', async () => {
    const created = await service.create(baseInput);
    const updated = await service.update(created.id, { priority: 'high' });
    expect(updated.priority).toBe('high');
    expect(updated.title).toBe(created.title);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it('marks a project complete', async () => {
    const created = await service.create(baseInput);
    const completed = await service.complete(created.id);
    expect(completed.status).toBe('completed');
  });

  it('removes a project', async () => {
    const created = await service.create(baseInput);
    await service.remove(created.id);
    await expect(service.get(created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError for unknown ids', async () => {
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update('nope', {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundError);
  });
});
