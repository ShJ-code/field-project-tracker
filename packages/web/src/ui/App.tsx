import { useState } from 'react';
import type { CreateProjectInput, Project } from '@field-tracker/shared';
import { useProjects } from '../app/use-projects.js';
import { ProjectForm } from './ProjectForm.js';
import { ProjectTable } from './ProjectTable.js';

export function App() {
  const { projects, loading, error, create, update, complete, remove } =
    useProjects();
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function handleSubmit(input: CreateProjectInput) {
    if (editing) {
      await update(editing.id, input);
      setEditing(null);
    } else {
      const created = await create(input);
      setSelectedId(created.id);
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
        <section className="panel">
          <h2>{editing ? 'Edit project' : 'New project'}</h2>
          <ProjectForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </section>

        <section className="panel">
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
              onEdit={(project) => setEditing(project)}
              onComplete={complete}
              onDelete={async (id) => {
                await remove(id);
                if (selectedId === id) setSelectedId(null);
                if (editing?.id === id) setEditing(null);
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
