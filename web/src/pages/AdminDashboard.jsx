import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, MapPin, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text">Administrator Overview</h1>
        <p className="text-sm text-text-muted mt-1">
          Welcome back, {user?.first_name || user?.username}. Manage guards, site locations, and shift schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/guards"
          className="p-5 bg-surface rounded-lg border border-border hover:border-accent transition-colors duration-150 block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-accent/10 text-accent">
              <Users size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">Guard Records</div>
              <div className="text-xs text-text-muted">Manage active and inactive staff</div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/locations"
          className="p-5 bg-surface rounded-lg border border-border hover:border-accent transition-colors duration-150 block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-accent/10 text-accent">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">Locations</div>
              <div className="text-xs text-text-muted">Configure site geofences</div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/schedules"
          className="p-5 bg-surface rounded-lg border border-border hover:border-accent transition-colors duration-150 block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-accent/10 text-accent">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">Schedules</div>
              <div className="text-xs text-text-muted">Plan weekly shifts without overlap</div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 bg-surface rounded-lg border border-border hover:border-accent transition-colors duration-150 block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-accent/10 text-accent">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-text">Operational Reports</div>
              <div className="text-xs text-text-muted">Review attendance and performance</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-sm font-semibold text-text mb-3">System Foundation Status</h2>
        <div className="space-y-2 text-xs text-text-muted">
          <p>Phase 1 & Phase 2 foundation extensions are operational. The database is seeded with demo admins, supervisors, clients, guards, locations, duty posts, and shifts.</p>
          <p>Use the navigation menu to browse management sections or review legal policies.</p>
        </div>
      </div>
    </div>
  );
}
