import { useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  PRIORITIES,
  PROJECT_STATUSES,
  type CreateProjectInput,
  type GeocodeResult,
  type Priority,
  type Project,
  type ProjectStatus,
} from '@field-tracker/shared';
import { useGeocoder } from '../app/use-geocoder.js';
import { labelize } from './format.js';

interface Props {
  /** When provided, the form edits this project; otherwise it creates a new one. */
  initial?: Project | null;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY = {
  title: '',
  status: 'planned' as ProjectStatus,
  priority: 'medium' as Priority,
  dueDate: '',
  latitude: '',
  longitude: '',
  notes: '',
};

export function ProjectForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? EMPTY.title);
  const [status, setStatus] = useState<ProjectStatus>(
    initial?.status ?? EMPTY.status,
  );
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? EMPTY.priority,
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? EMPTY.dueDate);
  const [latitude, setLatitude] = useState(
    initial ? String(initial.latitude) : EMPTY.latitude,
  );
  const [longitude, setLongitude] = useState(
    initial ? String(initial.longitude) : EMPTY.longitude,
  );
  const [notes, setNotes] = useState(initial?.notes ?? EMPTY.notes);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const geocoder = useGeocoder();

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault(); // don't submit the whole form
      void geocoder.search(address);
    }
  }

  function pickPlace(place: GeocodeResult) {
    setLatitude(String(place.latitude));
    setLongitude(String(place.longitude));
    setAddress(place.label);
    geocoder.clear();
  }

  function resetToEmpty() {
    setTitle(EMPTY.title);
    setStatus(EMPTY.status);
    setPriority(EMPTY.priority);
    setDueDate(EMPTY.dueDate);
    setLatitude(EMPTY.latitude);
    setLongitude(EMPTY.longitude);
    setNotes(EMPTY.notes);
    setAddress('');
    geocoder.clear();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!latitude || Number.isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (!longitude || Number.isNaN(lon) || lon < -180 || lon > 180) {
      setFormError('Longitude must be a number between -180 and 180.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        status,
        priority,
        dueDate: dueDate ? dueDate : null,
        latitude: lat,
        longitude: lon,
        notes: notes.trim(),
      });
      if (!initial) {
        resetToEmpty();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field field--wide">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Substation inspection"
        />
      </label>

      <label className="field">
        <span>Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelize(s)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Priority</span>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {labelize(p)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Due date</span>
        <input
          type="date"
          value={dueDate ?? ''}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>

      <div className="field field--wide">
        <span>Find by address</span>
        <div className="address-search">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            placeholder="Search an address or place, e.g. 1600 Pennsylvania Ave NW"
          />
          <button
            type="button"
            className="button--ghost"
            onClick={() => void geocoder.search(address)}
            disabled={geocoder.status === 'loading' || address.trim().length < 3}
          >
            {geocoder.status === 'loading' ? 'Searching…' : 'Find'}
          </button>
        </div>
        {geocoder.status === 'empty' && (
          <p className="muted address-search__hint">No matches found.</p>
        )}
        {geocoder.status === 'error' && (
          <p className="error address-search__hint">
            Address lookup failed. Try again.
          </p>
        )}
        {geocoder.results.length > 0 && (
          <ul className="address-results">
            {geocoder.results.map((place, index) => (
              <li key={`${place.latitude},${place.longitude},${index}`}>
                <button
                  type="button"
                  className="address-results__item"
                  onClick={() => pickPlace(place)}
                >
                  <span className="address-results__label">{place.label}</span>
                  <span className="mono address-results__coords">
                    {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="field">
        <span>Latitude</span>
        <input
          inputMode="decimal"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="40.69"
        />
      </label>

      <label className="field">
        <span>Longitude</span>
        <input
          inputMode="decimal"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="-80.31"
        />
      </label>

      <label className="field field--wide">
        <span>Notes</span>
        <textarea
          value={notes}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional details"
        />
      </label>

      {formError && <p className="error form__error">{formError}</p>}

      <div className="form__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add project'}
        </button>
        {onCancel && (
          <button type="button" className="button--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
