import { useState } from 'react';
import type { CreateProjectInput } from '@field-tracker/shared';
import { useProjects } from '../app/use-projects';
import type { MapAdapterFactory } from '../integrations/map/map-adapter';
import { ProjectForm } from './ProjectForm';
import { ProjectMap } from './ProjectMap';
import { ProjectTable } from './ProjectTable';

interface AppProps {
  createMap: MapAdapterFactory;
}

export function App({ createMap }: AppProps) {
  const { projects, loading, error, create, update, complete, remove } =
    useProjects();
  // A single source of truth: the selected project is also the one being
  // edited. null = "New project" mode.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  async function handleSubmit(input: CreateProjectInput) {
    if (selectedProject) {
      await update(selectedProject.id, input);
    } else {
      await create(input); // stay in New mode; the form clears itself
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Field Project Tracker</h1>
        <p className="muted">
          Track field projects and see live site risk from on-site weather.
        </p>
      </header>

      <main className="app__layout">
        <section className="panel panel--form">
          <div className="panel__header">
            <h2>{selectedProject ? 'Edit project' : 'New project'}</h2>
            {selectedProject && (
              <button
                className="button--ghost"
                onClick={() => setSelectedId(null)}
              >
                + New project
              </button>
            )}
          </div>
          <ProjectForm
            key={selectedId ?? 'new'}
            initial={selectedProject}
            onSubmit={handleSubmit}
          />
        </section>

        <section className="panel panel--list">
          <div className="panel__header">
            <h2>Projects</h2>
            <span className="muted">{projects.length} total</span>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <ProjectTable
              projects={projects}
              selectedId={selectedId}
              onSelect={(project) => setSelectedId(project.id)}
              onComplete={complete}
              onDelete={async (id) => {
                await remove(id);
                if (selectedId === id) setSelectedId(null);
              }}
            />
          )}
        </section>

        <section className="panel panel--map">
          <div className="panel__header">
            <h2>Map</h2>
            <span className="muted">Click a marker or row to select</span>
          </div>
          <ProjectMap
            createMap={createMap}
            projects={projects}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
      </main>
    </div>
  );
}
