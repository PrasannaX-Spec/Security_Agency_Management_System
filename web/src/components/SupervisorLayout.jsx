import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConsentModal from './ConsentModal';
import DemoDataBadge from './DemoDataBadge';
import {
  Shield,
  MapPin,
  AlertTriangle,
  Bell,
  MessageSquare,
  Clock,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/supervisor/live', label: 'Live Map', icon: MapPin },
  { to: '/supervisor/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/supervisor/panic', label: 'Panic Alerts', icon: Bell },
  { to: '/supervisor/requests', label: 'Quick Requests', icon: MessageSquare },
  { to: '/supervisor/availability', label: 'Availability', icon: Clock },
];

export default function SupervisorLayout() {
  const { user, logout, needsConsent } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {needsConsent && <ConsentModal />}

      {/* Top Navigation */}
      <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white">
            <Shield size={18} />
          </div>
          <span className="font-semibold text-text text-sm sm:text-base">
            Supervisor Monitoring
          </span>
          <DemoDataBadge />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-text">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="text-[11px] text-text-muted">Supervisor</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-background hover:text-text transition-colors duration-150"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border bg-surface flex flex-col py-4 px-2 shrink-0">
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-text-muted hover:bg-background hover:text-text'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border px-2 text-[11px] text-text-muted space-y-1">
            <div>
              <a href="/terms" target="_blank" rel="noreferrer" className="hover:underline">
                Terms of Service
              </a>
              {' · '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="hover:underline">
                Privacy Policy
              </a>
            </div>
            <div>Supervisor Field Console</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
