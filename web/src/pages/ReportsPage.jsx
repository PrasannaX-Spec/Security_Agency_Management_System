import React from 'react';
import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Operational Reports</h1>
          <p className="text-sm text-text-muted mt-1">
            Aggregate reports for attendance, schedules, and guard performance.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-background transition-colors duration-150"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <FileText size={24} />
        </div>
        <div className="text-sm font-medium text-text">Reports and Analytics</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          No data yet
        </div>
      </div>
    </div>
  );
}
