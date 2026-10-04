import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit2, MapPin, X, AlertCircle, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { getSupervisors, createSupervisor, updateSupervisor, assignSitesToSupervisor, getLocations } from '../api/masterData';

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      const [supRes, locRes] = await Promise.all([
        getSupervisors(params),
        getLocations({ page_size: 100 }),
      ]);

      if (supRes.success) {
        const supList = supRes.data.results || supRes.data;
        if (Array.isArray(supList)) setSupervisors(supList);
      } else {
        setError('Failed to fetch supervisors list');
      }

      if (locRes.success) {
        const locList = locRes.data.results || locRes.data;
        if (Array.isArray(locList)) setLocations(locList);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading supervisor records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
    });
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupervisor(sup);
    setFormData({
      username: sup.username || '',
      password: '',
      first_name: sup.first_name || '',
      last_name: sup.last_name || '',
      phone: sup.phone || '',
      email: sup.email || '',
      status: sup.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenAssign = (sup) => {
    setSelectedSupervisor(sup);
    // pre-select already assigned location IDs if available
    const assignedIds = sup.assigned_locations
      ? sup.assigned_locations.map((loc) => (typeof loc === 'object' ? loc.id : loc))
      : [];
    setSelectedLocationIds(assignedIds);
    setFormError('');
    setIsAssignModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await createSupervisor(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to create supervisor');
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
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
      };
      const res = await updateSupervisor(selectedSupervisor.id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to update supervisor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLocationSelect = (locId) => {
    if (selectedLocationIds.includes(locId)) {
      setSelectedLocationIds(selectedLocationIds.filter((id) => id !== locId));
    } else {
      setSelectedLocationIds([...selectedLocationIds, locId]);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await assignSitesToSupervisor(selectedSupervisor.id, selectedLocationIds);
      if (res.success) {
        setIsAssignModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to assign locations');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Field Supervisors</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage supervisor accounts and scope field management permissions to assigned site locations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 shrink-0"
        >
          <Plus size={16} />
          <span>Add Supervisor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or username..."
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

        <button
          onClick={fetchData}
          title="Refresh"
          className="p-1.5 rounded-md border border-border bg-background text-text-muted hover:text-text hover:bg-surface"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main Table or Empty State */}
      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Loading field supervisors...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-error">
          {error}
        </div>
      ) : supervisors.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
            <UserCheck size={24} />
          </div>
          <div className="text-sm font-medium text-text">Field Supervisors</div>
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
                  <th className="px-4 py-3">Supervisor Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Assigned Locations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {supervisors.map((sup) => (
                  <tr key={sup.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text">
                      {sup.first_name || sup.last_name
                        ? `${sup.first_name} ${sup.last_name}`.trim()
                        : sup.username}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted">{sup.username}</td>
                    <td className="px-4 py-3 text-text-muted">{sup.phone || 'N/A'}</td>
                    <td className="px-4 py-3 text-text-muted">{sup.email || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-text">
                        {sup.assigned_locations?.length || 0} sites assigned
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sup.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {sup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenAssign(sup)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/10"
                      >
                        <MapPin size={12} />
                        Assign Sites
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-background"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supervisor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Register New Supervisor</h2>
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
                  <label className="block text-xs font-medium text-text mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Create Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supervisor Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Edit Supervisor Profile</h2>
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
                  <label className="block text-xs font-medium text-text mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : 'Update Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Sites Modal */}
      {isAssignModalOpen && selectedSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">Assign Site Locations</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Supervisor: {selectedSupervisor.first_name} {selectedSupervisor.last_name} ({selectedSupervisor.username})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-rose-500/10 p-3 text-xs text-rose-600 border border-rose-500/20 shrink-0">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="my-4 overflow-y-auto space-y-2 flex-1 pr-1">
              {locations.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-6">No locations available yet.</div>
              ) : (
                locations.map((loc) => {
                  const isChecked = selectedLocationIds.includes(loc.id);
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleToggleLocationSelect(loc.id)}
                      className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-accent bg-accent/5'
                          : 'border-border bg-background hover:bg-surface'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-text">{loc.name}</div>
                        <div className="text-[11px] text-text-muted">{loc.address}</div>
                      </div>
                      <div className="text-accent">
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-text-muted" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-text hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSubmit}
                disabled={isSubmitting}
                className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Site Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
