import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  Shield,
  MapPin,
  Building,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getSchedules,
  createSchedule,
  cancelSchedule,
} from '../api/schedules';
import {
  getClients,
  getLocations,
  getPosts,
  getGuards,
} from '../api/masterData';

export default function SchedulesPage() {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'SUPERVISOR';

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'

  // Master data
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [posts, setPosts] = useState([]);
  const [guards, setGuards] = useState([]);

  // Filters
  const [filterClient, setFilterClient] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPost, setFilterPost] = useState('');
  const [filterGuard, setFilterGuard] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Advisory warning toast (for over-capacity notices)
  const [advisoryToast, setAdvisoryToast] = useState(null);

  // New Shift Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalClientId, setModalClientId] = useState('');
  const [modalLocationId, setModalLocationId] = useState('');
  const [modalPostId, setModalPostId] = useState('');
  const [modalGuardId, setModalGuardId] = useState('');
  const [modalShiftStart, setModalShiftStart] = useState('');
  const [modalShiftEnd, setModalShiftEnd] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalConflict, setModalConflict] = useState(null);

  // Cancel Modal state
  const [scheduleToCancel, setScheduleToCancel] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Load master data once
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [cRes, lRes, pRes, gRes] = await Promise.all([
          getClients({ page_size: 100 }),
          getLocations({ page_size: 100 }),
          getPosts({ page_size: 100 }),
          getGuards({ page_size: 100 }),
        ]);

        if (cRes?.success) {
          setClients(cRes.data?.results || cRes.data || []);
        }
        if (lRes?.success) {
          setLocations(lRes.data?.results || lRes.data || []);
        }
        if (pRes?.success) {
          setPosts(pRes.data?.results || pRes.data || []);
        }
        if (gRes?.success) {
          setGuards(gRes.data?.results || gRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load master data', err);
      }
    }
    loadMasterData();
  }, []);

  // Fetch schedules
  const fetchSchedulesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (filterClient) params.client_id = filterClient;
      if (filterLocation) params.location_id = filterLocation;
      if (filterPost) params.post_id = filterPost;
      if (filterGuard) params.guard_id = filterGuard;
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;

      const res = await getSchedules(params);
      if (res?.success) {
        if (res.data?.results) {
          setSchedules(res.data.results);
          setTotalCount(res.data.count || 0);
        } else if (Array.isArray(res.data)) {
          setSchedules(res.data);
          setTotalCount(res.data.length);
        }
      } else {
        setError(res?.error?.message || 'Failed to fetch schedules');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error loading duty schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulesList();
  }, [page, filterClient, filterLocation, filterPost, filterGuard, filterDate, filterStatus]);

  // Cascading selections for modal
  const modalAvailableLocations = locations.filter(
    (loc) => !modalClientId || String(loc.client?.id || loc.client) === String(modalClientId)
  );

  const modalAvailablePosts = posts.filter(
    (p) => !modalLocationId || String(p.location?.id || p.location) === String(modalLocationId)
  );

  const selectedPostObj = posts.find((p) => String(p.id) === String(modalPostId));
  const selectedGuardObj = guards.find((g) => String(g.id) === String(modalGuardId));

  const handleOpenNewModal = () => {
    setModalClientId(clients[0]?.id ? String(clients[0].id) : '');
    const firstLoc = locations.find((l) => !clients[0] || String(l.client?.id || l.client) === String(clients[0]?.id));
    setModalLocationId(firstLoc ? String(firstLoc.id) : '');
    const firstPost = posts.find((p) => firstLoc && String(p.location?.id || p.location) === String(firstLoc.id));
    setModalPostId(firstPost ? String(firstPost.id) : '');
    setModalGuardId(guards[0]?.id ? String(guards[0].id) : '');

    // Set default tomorrow 08:00 to 20:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setModalShiftStart(`${dateStr}T08:00`);
    setModalShiftEnd(`${dateStr}T20:00`);

    setModalError('');
    setModalConflict(null);
    setIsNewModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalConflict(null);

    if (!modalClientId || !modalLocationId || !modalPostId || !modalGuardId || !modalShiftStart || !modalShiftEnd) {
      setModalError('Please complete all required fields');
      return;
    }

    const startIso = new Date(modalShiftStart).toISOString();
    const endIso = new Date(modalShiftEnd).toISOString();

    if (new Date(modalShiftEnd) <= new Date(modalShiftStart)) {
      setModalError('Shift end time must be after shift start time');
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        client: parseInt(modalClientId, 10),
        location: parseInt(modalLocationId, 10),
        post: parseInt(modalPostId, 10),
        guard: parseInt(modalGuardId, 10),
        shift_start: startIso,
        shift_end: endIso,
      };

      const res = await createSchedule(payload);
      if (res?.success) {
        setIsNewModalOpen(false);
        // Check for advisory warning
        if (res.data?.warning) {
          setAdvisoryToast(res.data.warning);
        }
        fetchSchedulesList();
      } else {
        setModalError(res?.error?.message || 'Failed to create schedule');
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      if (err.response?.status === 409 && errData?.code === 'SCHEDULE_CONFLICT') {
        setModalConflict({
          message: errData.message || 'Shift conflict detected',
          schedule: errData.conflicting_schedule,
        });
      } else if (errData?.details) {
        const detailsStr = typeof errData.details === 'object'
          ? Object.entries(errData.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : String(errData.details);
        setModalError(detailsStr);
      } else {
        setModalError(errData?.message || 'Error creating schedule');
      }
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!scheduleToCancel) return;
    setCancelSubmitting(true);
    try {
      const res = await cancelSchedule(scheduleToCancel.id);
      if (res?.success) {
        setScheduleToCancel(null);
        fetchSchedulesList();
      } else {
        setError(res?.error?.message || 'Failed to cancel schedule');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error cancelling schedule');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return '-';
    const s = new Date(startIso);
    const e = new Date(endIso);
    const diffHours = (e - s) / (1000 * 60 * 60);
    return `${diffHours.toFixed(1)} hrs`;
  };

  // Helper for timeline rendering
  const timelineDate = filterDate || new Date().toISOString().split('T')[0];
  const timelineSchedules = schedules.filter((s) => {
    const sDate = s.shift_start ? s.shift_start.split('T')[0] : '';
    return sDate === timelineDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Duty Schedules</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage guard allocations, site posts, and temporal schedule shifts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <LayoutList size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Clock size={14} />
              <span>Timeline</span>
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150"
            >
              <Plus size={16} />
              <span>New Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Advisory Toast */}
      {advisoryToast && (
        <div className="flex items-start justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-semibold">Advisory Capacity Warning</div>
              <div className="text-xs mt-0.5">
                {advisoryToast.message ||
                  `Post requires ${advisoryToast.required_guards} guards. Currently assigned: ${advisoryToast.active_overlapping_count} guards.`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdvisoryToast(null)}
            className="text-amber-700 hover:text-amber-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-text mb-3">
          <Filter size={14} />
          <span>Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Client Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Client</label>
            <select
              value={filterClient}
              onChange={(e) => {
                setFilterClient(e.target.value);
                setFilterLocation('');
                setFilterPost('');
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Site</label>
            <select
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setFilterPost('');
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Sites</option>
              {locations
                .filter((l) => !filterClient || String(l.client?.id || l.client) === String(filterClient))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Post Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Post</label>
            <select
              value={filterPost}
              onChange={(e) => {
                setFilterPost(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Posts</option>
              {posts
                .filter((p) => !filterLocation || String(p.location?.id || p.location) === String(filterLocation))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Guard Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Guard</label>
            <select
              value={filterGuard}
              onChange={(e) => {
                setFilterGuard(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Guards</option>
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.full_name} ({g.id_number})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filterClient || filterLocation || filterPost || filterGuard || filterDate || filterStatus) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterClient('');
                setFilterLocation('');
                setFilterPost('');
                setFilterGuard('');
                setFilterDate('');
                setFilterStatus('');
                setPage(1);
              }}
              className="text-xs text-accent hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-xs text-text-muted">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2 text-accent" />
          <span>Loading schedules...</span>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background text-text-muted font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">Guard</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Post</th>
                  <th className="px-4 py-3">Shift Start</th>
                  <th className="px-4 py-3">Shift End</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-text-muted">
                      No duty schedules match the current filters.
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div>{s.guard_name || 'Unassigned'}</div>
                        <div className="text-[11px] text-text-muted">{s.guard_id_number}</div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{s.client_name || '-'}</td>
                      <td className="px-4 py-3 font-medium">{s.location_name || '-'}</td>
                      <td className="px-4 py-3 text-text-muted">{s.post_name || '-'}</td>
                      <td className="px-4 py-3">{formatDateTime(s.shift_start)}</td>
                      <td className="px-4 py-3">{formatDateTime(s.shift_end)}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {calculateDuration(s.shift_start, s.shift_end)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            s.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : s.status === 'COMPLETED'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {s.status === 'SCHEDULED' ? (
                            <button
                              type="button"
                              onClick={() => setScheduleToCancel(s)}
                              className="rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Cancel Shift
                            </button>
                          ) : (
                            <span className="text-[11px] text-text-muted">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 20 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-muted">
              <div>Total {totalCount} records</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-border p-1 hover:bg-background disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  disabled={page * 20 >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-border p-1 hover:bg-background disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="text-xs font-semibold text-text">
              24-Hour Timeline: {timelineDate}
            </div>
            <div className="text-[11px] text-text-muted">
              Horizontal blocks indicate scheduled shift allocations.
            </div>
          </div>

          {/* Time markers bar */}
          <div className="grid grid-cols-6 border-b border-border pb-1 text-[11px] font-mono text-text-muted">
            <div>00:00</div>
            <div>04:00</div>
            <div>08:00</div>
            <div>12:00</div>
            <div>16:00</div>
            <div className="text-right">24:00</div>
          </div>

          {/* Grouped by location & post */}
          {locations.map((loc) => {
            const locPosts = posts.filter(
              (p) => String(p.location?.id || p.location) === String(loc.id)
            );
            if (locPosts.length === 0) return null;

            return (
              <div key={loc.id} className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <MapPin size={12} className="text-accent" />
                  <span>{loc.name}</span>
                </div>

                <div className="space-y-1.5 pl-4 border-l-2 border-border ml-1">
                  {locPosts.map((post) => {
                    const postSchedules = timelineSchedules.filter(
                      (s) => String(s.post) === String(post.id) || s.post_name === post.name
                    );

                    return (
                      <div key={post.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-text-muted">
                          <span>{post.name}</span>
                          <span>Cap: {post.required_guard_count || 1}</span>
                        </div>

                        {/* 24-hour track */}
                        <div className="relative h-8 w-full rounded bg-slate-100 border border-slate-200">
                          {postSchedules.map((sched) => {
                            const s = new Date(sched.shift_start);
                            const e = new Date(sched.shift_end);
                            const startHr = s.getHours() + s.getMinutes() / 60;
                            let endHr = e.getHours() + e.getMinutes() / 60;
                            if (e.getDate() !== s.getDate()) endHr = 24;

                            const leftPercent = (startHr / 24) * 100;
                            const widthPercent = Math.max(((endHr - startHr) / 24) * 100, 2);

                            return (
                              <div
                                key={sched.id}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                                className={`absolute top-1 bottom-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate flex items-center overflow-hidden border ${
                                  sched.status === 'SCHEDULED'
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : sched.status === 'COMPLETED'
                                    ? 'bg-green-600 text-white border-green-700'
                                    : 'bg-slate-300 text-slate-700 border-slate-400'
                                }`}
                                title={`${sched.guard_name}: ${formatDateTime(sched.shift_start)} to ${formatDateTime(sched.shift_end)} (${sched.status})`}
                              >
                                {sched.guard_name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CASCADING NEW SHIFT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text">New Duty Shift</h2>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conflict Alert Banner */}
            {modalConflict && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-red-800">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Shift Conflict Detected</span>
                </div>
                <div>{modalConflict.message}</div>
                {modalConflict.schedule && (
                  <div className="text-[11px] text-red-700 font-mono mt-1">
                    Existing shift at {modalConflict.schedule.location_name} (
                    {modalConflict.schedule.post_name}) from{' '}
                    {formatDateTime(modalConflict.schedule.shift_start)} to{' '}
                    {formatDateTime(modalConflict.schedule.shift_end)}.
                  </div>
                )}
              </div>
            )}

            {/* Form General Error */}
            {modalError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {/* Step 1: Client */}
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  1. Select Client
                </label>
                <select
                  value={modalClientId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setModalClientId(cid);
                    const matchingLocs = locations.filter(
                      (l) => !cid || String(l.client?.id || l.client) === String(cid)
                    );
                    const firstLocId = matchingLocs[0]?.id ? String(matchingLocs[0].id) : '';
                    setModalLocationId(firstLocId);
                    const matchingPosts = posts.filter(
                      (p) => firstLocId && String(p.location?.id || p.location) === String(firstLocId)
                    );
                    setModalPostId(matchingPosts[0]?.id ? String(matchingPosts[0].id) : '');
                  }}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Location */}
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  2. Select Site
                </label>
                <select
                  value={modalLocationId}
                  onChange={(e) => {
                    const lid = e.target.value;
                    setModalLocationId(lid);
                    const matchingPosts = posts.filter(
                      (p) => lid && String(p.location?.id || p.location) === String(lid)
                    );
                    setModalPostId(matchingPosts[0]?.id ? String(matchingPosts[0].id) : '');
                  }}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select site location...</option>
                  {modalAvailableLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Post & Capacity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-text-muted">
                    3. Select Post
                  </label>
                  {selectedPostObj && (
                    <span className="text-[11px] font-medium text-accent">
                      Required capacity: {selectedPostObj.required_guard_count || 1} guards
                    </span>
                  )}
                </div>
                <select
                  value={modalPostId}
                  onChange={(e) => setModalPostId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select post...</option>
                  {modalAvailablePosts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Requires {p.required_guard_count || 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Guard */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-text-muted">
                    4. Select Guard
                  </label>
                  {selectedGuardObj && (
                    <span className="text-[11px] text-text-muted">
                      Status: {selectedGuardObj.status || 'Active'}
                    </span>
                  )}
                </div>
                <select
                  value={modalGuardId}
                  onChange={(e) => setModalGuardId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select assigned guard...</option>
                  {guards.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.full_name} ({g.id_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 5: Shift Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Shift Start
                  </label>
                  <input
                    type="datetime-local"
                    value={modalShiftStart}
                    onChange={(e) => setModalShiftStart(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Shift End
                  </label>
                  <input
                    type="datetime-local"
                    value={modalShiftEnd}
                    onChange={(e) => setModalShiftEnd(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-md border border-border px-3 py-1.5 text-text-muted hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-md bg-accent px-4 py-1.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {modalSubmitting ? 'Creating...' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {scheduleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-text">Confirm Shift Cancellation</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to cancel the scheduled shift for{' '}
              <span className="font-semibold text-text">{scheduleToCancel.guard_name}</span> at{' '}
              <span className="font-semibold text-text">{scheduleToCancel.location_name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleToCancel(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-background"
              >
                Keep Shift
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleConfirmCancel}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelSubmitting ? 'Cancelling...' : 'Yes, Cancel Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
