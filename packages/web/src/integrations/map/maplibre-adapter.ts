import maplibregl from 'maplibre-gl';
import type { MapAdapter, MapAdapterFactory, MapMarker } from './map-adapter.js';

// Keyless vector tiles from OpenFreeMap; override with VITE_MAP_STYLE_URL.
const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [-98.5, 39.8]; // continental US
const DEFAULT_ZOOM = 3.2;

/**
 * Adapter: the only file in the web app that imports `maplibre-gl`. It turns
 * the small {@link MapAdapter} surface into concrete MapLibre calls.
 */
class MapLibreAdapter implements MapAdapter {
  private readonly map: maplibregl.Map;
  private readonly markers = new Map<string, maplibregl.Marker>();
  private clickHandler: ((id: string) => void) | null = null;

  constructor(container: HTMLElement, styleUrl: string) {
    this.map = new maplibregl.Map({
      container,
      style: styleUrl,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    this.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );
  }

  setMarkers(markers: MapMarker[]): void {
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();

    for (const data of markers) {
      const element = document.createElement('div');
      element.className = `map-marker map-marker--${data.priority}`;
      element.title = data.title;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        this.clickHandler?.(data.id);
      });

      const marker = new maplibregl.Marker({ element })
        .setLngLat([data.longitude, data.latitude])
        .addTo(this.map);
      this.markers.set(data.id, marker);
    }
  }

  setSelected(id: string | null): void {
    for (const [markerId, marker] of this.markers) {
      marker.getElement().classList.toggle('is-selected', markerId === id);
    }
  }

  focus(id: string): void {
    const marker = this.markers.get(id);
    if (!marker) {
      return;
    }
    this.map.flyTo({
      center: marker.getLngLat(),
      zoom: Math.max(this.map.getZoom(), 8),
      speed: 1.2,
    });
  }

  onMarkerClick(handler: (id: string) => void): void {
    this.clickHandler = handler;
  }

  destroy(): void {
    this.map.remove();
  }
}

export const createMapLibreAdapter: MapAdapterFactory = (container) => {
  const styleUrl = import.meta.env.VITE_MAP_STYLE_URL ?? DEFAULT_STYLE;
  return new MapLibreAdapter(container, styleUrl);
};
