import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text">Guard Quick Requests</h1>
        <p className="text-sm text-text-muted mt-1">
          Predefined status inquiries and assistance requests from guards on site.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
          <MessageSquare size={24} />
        </div>
        <div className="text-sm font-medium text-text">Quick Requests Shell</div>
        <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Predefined response options and resolution tracking will be linked in Phase 3.
        </div>
      </div>
    </div>
  );
}
