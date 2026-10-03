import React from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

export default function LiveMapPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Live Guard Map</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time GPS positions and geofence status for assigned locations.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-background transition-colors duration-150"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <MapPin size={24} />
        </div>
        <div className="text-sm font-medium text-text">Live Map Console Shell</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Leaflet map with active guard markers and geofence polygons will be linked in Phase 3.
        </div>
      </div>
    </div>
  );
}
