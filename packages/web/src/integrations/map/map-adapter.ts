import type { Priority, RiskLevel } from '@field-tracker/shared';

/** The data a marker needs — deliberately not a full Project. */
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  priority: Priority;
}

/** Structured popup content; the adapter decides how to render it. */
export interface MapPopupContent {
  title: string;
  lines: string[];
  risk?: { level: RiskLevel; label: string };
}

/**
 * Port: the map capabilities the UI depends on. Nothing here mentions MapLibre,
 * so the UI can drive the map without importing the mapping SDK. Swapping to
 * Mapbox/Google means writing a new adapter that satisfies this interface.
 */
export interface MapAdapter {
  setMarkers(markers: MapMarker[]): void;
  setSelected(id: string | null): void;
  focus(id: string): void;
  onMarkerClick(handler: (id: string) => void): void;
  showPopup(id: string, content: MapPopupContent): void;
  hidePopup(): void;
  destroy(): void;
}

/** Builds a map bound to a DOM container. Chosen at the composition root. */
export type MapAdapterFactory = (container: HTMLElement) => MapAdapter;
