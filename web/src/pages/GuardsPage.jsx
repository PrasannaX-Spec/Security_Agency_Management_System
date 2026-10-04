import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, UserX, X, AlertCircle, RefreshCw } from 'lucide-react';
import { getGuards, createGuard, updateGuard, deactivateGuard } from '../api/masterData';

export default function GuardsPage() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    id_number: '',
    dob: '',
    address: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    wage_type: 'HOURLY',
    wage_rate: '0.00',
  });

  const fetchGuards = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await getGuards(params);
      if (response.success) {
        if (response.data.results) {
          setGuards(response.data.results);
          setTotalCount(response.data.count || 0);
        } else if (Array.isArray(response.data)) {
          setGuards(response.data);
          setTotalCount(response.data.length);
        }
      } else {
        setError('Failed to fetch guards list');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading guard records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGuards();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      phone: '',
      id_number: '',
      dob: '',
      address: '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      wage_type: 'HOURLY',
      wage_rate: '0.00',
    });
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (guard) => {
    setSelectedGuard(guard);
    setFormData({
      username: guard.user_info?.username || '',
      password: '',
      full_name: guard.full_name || '',
      phone: guard.phone || '',
      id_number: guard.id_number || '',
      dob: guard.dob || '',
      address: guard.address || '',
      joining_date: guard.joining_date || new Date().toISOString().split('T')[0],
      status: guard.status || 'ACTIVE',
      wage_type: guard.wage_type || 'HOURLY',
      wage_rate: guard.wage_rate || '0.00',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDeactivate = (guard) => {
    setSelectedGuard(guard);
    setIsDeactivateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await createGuard(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchGuards();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to create guard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        id_number: formData.id_number,
        address: formData.address,
        status: formData.status,
        wage_type: formData.wage_type,
        wage_rate: formData.wage_rate,
      };
      const res = await updateGuard(selectedGuard.id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchGuards();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to update guard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    setIsSubmitting(true);
    try {
      const res = await deactivateGuard(selectedGuard.id);
      if (res.success) {
        setIsDeactivateModalOpen(false);
        fetchGuards();
      }
    } catch (err) {
      alert('Failed to deactivate guard profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Guard Records</h1>
          <p className="text-sm text-text-muted mt-1">
            Register and manage security guard profiles, wages, and operational account statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 shrink-0"
        >
          <Plus size={16} />
          <span>Add Guard</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or ID number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 pl-9 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
          </div>
          <button
            type="submit"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text hover:bg-surface"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            onClick={fetchGuards}
            title="Refresh"
            className="p-1.5 rounded-md border border-border bg-background text-text-muted hover:text-text hover:bg-surface"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Loading guard records...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-error">
          {error}
        </div>
      ) : guards.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
            <Users size={24} />
          </div>
          <div className="text-sm font-medium text-text">Guard Management</div>
          <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            No data yet
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background text-text-muted uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">ID Number</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Wage</th>
                  <th className="px-4 py-3">Joining Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {guards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-text">{guard.id_number}</td>
                    <td className="px-4 py-3 font-medium">{guard.full_name}</td>
                    <td className="px-4 py-3 text-text-muted">{guard.phone}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${guard.wage_rate}</span>
                      <span className="text-text-muted text-[10px] ml-1">/ {guard.wage_type.toLowerCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{guard.joining_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          guard.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {guard.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(guard)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-background"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      {guard.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleOpenDeactivate(guard)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500/10"
                        >
                          <UserX size={12} />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Guard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Register New Guard</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-rose-500/10 p-3 text-xs text-rose-600 border border-rose-500/20">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">ID Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Wage Type</label>
                  <select
                    value={formData.wage_type}
                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Wage Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.wage_rate}
                    onChange={(e) => setFormData({ ...formData, wage_rate: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-text hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guard Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Edit Guard Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-rose-500/10 p-3 text-xs text-rose-600 border border-rose-500/20">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">ID Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Wage Type</label>
                  <select
                    value={formData.wage_type}
                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Wage Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.wage_rate}
                    onChange={(e) => setFormData({ ...formData, wage_rate: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-text hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {isDeactivateModalOpen && selectedGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-base font-bold text-text">Deactivate Guard Account</h2>
            <p className="text-xs text-text-muted mt-2">
              Are you sure you want to deactivate guard profile for <strong className="text-text">{selectedGuard.full_name}</strong> (ID: {selectedGuard.id_number})?
              This will also disable their mobile app login.
            </p>
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-text hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSubmitting}
                className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition-colors duration-150 disabled:opacity-50"
              >
                {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
