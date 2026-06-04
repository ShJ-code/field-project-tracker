import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GatewayProvider } from './app/gateway-context.js';
import { HttpProjectGateway } from './data/http-project-gateway.js';
import { createMapLibreAdapter } from './integrations/map/maplibre-adapter.js';
import { App } from './ui/App.js';
import './styles.css';

// Composition root: choose the concrete adapters once and inject them.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const gateway = new HttpProjectGateway(apiBaseUrl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GatewayProvider gateway={gateway}>
      <App createMap={createMapLibreAdapter} />
    </GatewayProvider>
  </React.StrictMode>,
);
