import { useEffect, useMemo, useRef } from 'react';
import type { Project } from '@field-tracker/shared';
import { useSiteWeather } from '../app/use-site-weather.js';
import type {
  MapAdapter,
  MapAdapterFactory,
  MapPopupContent,
} from '../integrations/map/map-adapter.js';
import { labelize } from './format.js';

interface Props {
  createMap: MapAdapterFactory;
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectMap({ createMap, projects, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );
  const weather = useSiteWeather(selectedProject);

  // Keep latest values reachable from stable callbacks/effects.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const adapter = createMap(containerRef.current);
    adapter.onMarkerClick((id) => onSelectRef.current(id));
    adapterRef.current = adapter;
    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [createMap]);

  // Push markers when the list changes, then re-apply the current selection
  // (rebuilding markers clears their selected state).
  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) {
      return;
    }
    adapter.setMarkers(
      projects.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        title: p.title,
        priority: p.priority,
      })),
    );
    adapter.setSelected(selectedIdRef.current);
  }, [projects]);

  // Reflect selection and fly to it.
  useEffect(() => {
    adapterRef.current?.setSelected(selectedId);
    if (selectedId) {
      adapterRef.current?.focus(selectedId);
    }
  }, [selectedId]);

  // Show a popup with live risk for the selected project.
  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) {
      return;
    }
    if (!selectedProject) {
      adapter.hidePopup();
      return;
    }
    adapter.showPopup(selectedProject.id, buildPopup(selectedProject, weather));
  }, [selectedProject, weather.data, weather.loading, weather.error]);

  return <div ref={containerRef} className="map" />;
}

function buildPopup(
  project: Project,
  weather: ReturnType<typeof useSiteWeather>,
): MapPopupContent {
  const lines: string[] = [];
  let risk: MapPopupContent['risk'];

  if (weather.loading) {
    lines.push('Checking weather…');
  } else if (weather.error || !weather.data) {
    lines.push('Weather unavailable');
  } else {
    const { current, risk: siteRisk } = weather.data;
    lines.push(`${Math.round(current.temperatureC)}°C · ${current.description}`);
    lines.push(`Wind ${Math.round(current.windSpeedKmh)} km/h`);
    if (siteRisk.factors.length > 0) {
      lines.push(siteRisk.factors.map((f) => f.label).join(', '));
    }
    risk = { level: siteRisk.level, label: `Site risk: ${labelize(siteRisk.level)}` };
  }

  return { title: project.title, lines, risk };
}
