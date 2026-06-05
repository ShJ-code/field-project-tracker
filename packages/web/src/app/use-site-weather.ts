import { useEffect, useState } from 'react';
import type { Project, SiteWeather } from '@field-tracker/shared';
import { useGateway } from './gateway-context';

/**
 * Fetches weather + computed site risk for a project. Results are cached by
 * project id + coordinates so the table row and the map popup share a single
 * request, and a location edit transparently refetches.
 */
const cache = new Map<string, Promise<SiteWeather>>();

function cacheKey(project: Project): string {
  return `${project.id}:${project.latitude}:${project.longitude}`;
}

interface State {
  data: SiteWeather | null;
  loading: boolean;
  error: string | null;
}

export function useSiteWeather(project: Project | null): State {
  const gateway = useGateway();
  const [state, setState] = useState<State>({
    data: null,
    loading: project !== null,
    error: null,
  });

  useEffect(() => {
    if (!project) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;
    const key = cacheKey(project);
    let request = cache.get(key);
    if (!request) {
      request = gateway.getWeather(project.id);
      cache.set(key, request);
    }

    setState({ data: null, loading: true, error: null });
    request.then(
      (data) => {
        if (active) setState({ data, loading: false, error: null });
      },
      (err) => {
        cache.delete(key); // allow a retry on next mount
        if (active) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Weather unavailable',
          });
        }
      },
    );

    return () => {
      active = false;
    };
    // Refetch when the project's identity or location changes.
  }, [gateway, project?.id, project?.latitude, project?.longitude]);

  return state;
}
