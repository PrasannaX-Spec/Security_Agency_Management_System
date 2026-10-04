import React from 'react';
import { Bell } from 'lucide-react';

export default function PanicPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text">Emergency Panic Alerts</h1>
        <p className="text-sm text-text-muted mt-1">
          High-priority emergency alerts triggered by on-duty guards.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <Bell size={24} />
        </div>
        <div className="text-sm font-medium text-text">Panic Dispatch</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          No data yet
        </div>
      </div>
    </div>
  );
}
