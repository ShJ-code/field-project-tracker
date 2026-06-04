import type { Project } from '@field-tracker/shared';
import { labelize } from './format.js';

interface Props {
  projects: Project[];
  selectedId?: string | null;
  onSelect?: (project: Project) => void;
  onEdit: (project: Project) => void;
  onComplete: (id: string) => Promise<unknown> | void;
  onDelete: (id: string) => Promise<unknown> | void;
}

export function ProjectTable({
  projects,
  selectedId,
  onSelect,
  onEdit,
  onComplete,
  onDelete,
}: Props) {
  if (projects.length === 0) {
    return <p className="muted">No projects yet. Add one using the form.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Due</th>
          <th>Location</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr
            key={project.id}
            className={selectedId === project.id ? 'is-selected' : undefined}
            onClick={() => onSelect?.(project)}
          >
            <td>{project.title}</td>
            <td>
              <span className={`pill pill--status-${project.status}`}>
                {labelize(project.status)}
              </span>
            </td>
            <td>
              <span className={`pill pill--priority-${project.priority}`}>
                {labelize(project.priority)}
              </span>
            </td>
            <td>{project.dueDate ?? '—'}</td>
            <td className="mono">
              {project.latitude.toFixed(2)}, {project.longitude.toFixed(2)}
            </td>
            <td
              className="table__actions"
              onClick={(event) => event.stopPropagation()}
            >
              <button className="button--ghost" onClick={() => onEdit(project)}>
                Edit
              </button>
              <button
                className="button--ghost"
                disabled={project.status === 'completed'}
                onClick={() => onComplete(project.id)}
              >
                Complete
              </button>
              <button
                className="button--ghost button--danger"
                onClick={() => {
                  if (window.confirm(`Delete "${project.title}"?`)) {
                    void onDelete(project.id);
                  }
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
