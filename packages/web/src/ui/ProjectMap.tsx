import { useEffect, useRef } from 'react';
import type { Project } from '@field-tracker/shared';
import type {
  MapAdapter,
  MapAdapterFactory,
} from '../integrations/map/map-adapter.js';

interface Props {
  createMap: MapAdapterFactory;
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectMap({ createMap, projects, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);

  // Keep the latest onSelect without re-creating the map.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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

  // Push markers whenever the project list changes.
  useEffect(() => {
    adapterRef.current?.setMarkers(
      projects.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        title: p.title,
        priority: p.priority,
      })),
    );
  }, [projects]);

  // Reflect the shared selection and fly to it.
  useEffect(() => {
    adapterRef.current?.setSelected(selectedId);
    if (selectedId) {
      adapterRef.current?.focus(selectedId);
    }
  }, [selectedId]);

  return <div ref={containerRef} className="map" />;
}
