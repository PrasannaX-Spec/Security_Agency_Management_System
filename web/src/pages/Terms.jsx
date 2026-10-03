import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTerms } from '../api/legal';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Terms() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTerms() {
      try {
        const res = await getTerms();
        setData(res);
      } catch {
        setError('Unable to load Terms and Conditions. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
          >
            <ArrowLeft size={16} />
            <span>Back to sign in</span>
          </Link>
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Shield size={16} className="text-accent" />
            <span>Security Agency Legal Documents</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 sm:p-10 shadow-sm">
          {loading && (
            <div className="py-12 text-center text-sm text-text-muted">
              Loading Terms and Conditions...
            </div>
          )}

          {error && (
            <div className="rounded-md bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          {data && (
            <div>
              <header className="border-b border-border pb-6 mb-8">
                <h1 className="text-2xl font-bold text-text">{data.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                  <span>Version {data.version}</span>
                  <span>·</span>
                  <span>Last updated: {data.updated_on}</span>
                </div>
              </header>

              <div className="space-y-6">
                {data.sections?.map((section, idx) => (
                  <section key={idx} className="space-y-2">
                    <h2 className="text-base font-semibold text-text">{section.heading}</h2>
                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
