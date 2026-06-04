import { createContext, useContext, type ReactNode } from 'react';
import type { ProjectGateway } from '../data/project-gateway.js';

/**
 * Dependency injection for the frontend: the concrete gateway is constructed
 * once at the composition root (main.tsx) and provided here. Hooks read it via
 * {@link useGateway} and therefore depend only on the port.
 */
const GatewayContext = createContext<ProjectGateway | null>(null);

export function GatewayProvider({
  gateway,
  children,
}: {
  gateway: ProjectGateway;
  children: ReactNode;
}) {
  return (
    <GatewayContext.Provider value={gateway}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway(): ProjectGateway {
  const gateway = useContext(GatewayContext);
  if (!gateway) {
    throw new Error('useGateway must be used within a GatewayProvider');
  }
  return gateway;
}
