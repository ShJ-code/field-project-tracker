import { useCallback, useEffect, useState } from 'react';
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@field-tracker/shared';
import { useGateway } from './gateway-context.js';

/**
 * View-model for the project list: owns the in-memory state and orchestrates
 * calls through the gateway. Components consume this and stay free of data
 * access concerns.
 */
export function useProjects() {
  const gateway = useGateway();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await gateway.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CreateProjectInput) => {
      const created = await gateway.create(input);
      setProjects((prev) => [created, ...prev]);
      return created;
    },
    [gateway],
  );

  const update = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      const updated = await gateway.update(id, input);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [gateway],
  );

  const complete = useCallback(
    async (id: string) => {
      const updated = await gateway.complete(id);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [gateway],
  );

  const remove = useCallback(
    async (id: string) => {
      await gateway.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [gateway],
  );

  return { projects, loading, error, refresh, create, update, complete, remove };
}
