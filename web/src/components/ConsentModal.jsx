import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function ConsentModal() {
  const { acceptTerms, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleAgree() {
    setSubmitting(true);
    setError('');
    try {
      await acceptTerms();
    } catch {
      setError('Unable to record acceptance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-md border border-border">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Terms and Privacy Consent</h2>
            <p className="text-sm text-text-muted">Review and accept the policies to continue</p>
          </div>
        </div>

        <div className="py-4 space-y-3 text-sm text-text">
          <p>
            To use this system, you must review and agree to our updated Terms and Conditions and
            Privacy Policy.
          </p>
          <div className="space-y-2 rounded-md bg-background p-3 border border-border">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-accent hover:text-accent-hover font-medium"
            >
              <span>Terms and Conditions</span>
              <ExternalLink size={16} />
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-accent hover:text-accent-hover font-medium"
            >
              <span>Privacy Policy</span>
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-xs text-text-muted">
            By clicking Accept and Continue, you confirm that you understand and agree to the
            retention of operational logs, shift data, and GPS tracking during duty hours.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-background"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={handleAgree}
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Accept and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
