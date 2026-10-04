import React from 'react';
import { Receipt } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Client Billing</h1>
        <p className="text-sm text-text-muted">Manage invoices and client billing histories.</p>
      </div>

      <div className="bg-surface rounded-lg border border-border p-12 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted mb-3">
          <Receipt size={24} />
        </div>
        <h3 className="text-base font-semibold text-text mb-1">Billing Invoices</h3>
        <p className="text-sm text-text-muted max-w-sm">No data yet</p>
      </div>
    </div>
  );
}
