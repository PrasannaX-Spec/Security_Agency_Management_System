import React from 'react';
import { MapPin, Plus } from 'lucide-react';

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Site Locations</h1>
          <p className="text-sm text-text-muted mt-1">
            Configure client deployment sites and GPS geofence radiuses.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150"
        >
          <Plus size={16} />
          <span>Add Location</span>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <MapPin size={24} />
        </div>
        <div className="text-sm font-medium text-text">Location Management Shell</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Geofence mapping and supervisor assignments will be linked in Phase 2.
        </div>
      </div>
    </div>
  );
}
