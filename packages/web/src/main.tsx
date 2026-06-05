import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GatewayProvider } from './app/gateway-context';
import { HttpProjectGateway } from './data/http-project-gateway';
import { createMapLibreAdapter } from './integrations/map/maplibre-adapter';
import { App } from './ui/App';
import './styles.css';

// Composition root: choose the concrete adapters once and inject them.
// In a production build the API is same-origin, so default to a relative base.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:4000');
const gateway = new HttpProjectGateway(apiBaseUrl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GatewayProvider gateway={gateway}>
      <App createMap={createMapLibreAdapter} />
    </GatewayProvider>
  </React.StrictMode>,
);
