import React from 'react';
import { Users, Plus } from 'lucide-react';

export default function GuardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Guard Records</h1>
          <p className="text-sm text-text-muted mt-1">
            Register and manage security guard profiles and account statuses.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150"
        >
          <Plus size={16} />
          <span>Add Guard</span>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <Users size={24} />
        </div>
        <div className="text-sm font-medium text-text">Guard Management Shell</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Core guard creation and soft-delete editing will be linked in Phase 2.
        </div>
      </div>
    </div>
  );
}
