import React from 'react';
import ReactDOM from 'react-dom/client';
import { GatewayProvider } from './app/gateway-context.js';
import { HttpProjectGateway } from './data/http-project-gateway.js';
import { App } from './ui/App.js';
import './styles.css';

// Composition root: build the concrete gateway once and inject it.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const gateway = new HttpProjectGateway(apiBaseUrl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GatewayProvider gateway={gateway}>
      <App />
    </GatewayProvider>
  </React.StrictMode>,
);
