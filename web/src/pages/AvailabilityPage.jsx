import React from 'react';
import { Clock } from 'lucide-react';

export default function AvailabilityPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text">Supervisor Availability</h1>
        <p className="text-sm text-text-muted mt-1">
          Set your duty availability status visible to guards at your assigned sites.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <Clock size={24} />
        </div>
        <div className="text-sm font-medium text-text">Availability Status</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          No data yet
        </div>
      </div>
    </div>
  );
}
