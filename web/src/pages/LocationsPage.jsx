import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Edit2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { getLocations, createLocation, updateLocation, getClients } from '../api/masterData';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    address: '',
    latitude: '',
    longitude: '',
    geofence_radius_m: '100',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [locRes, clientRes] = await Promise.all([
        getLocations(params),
        getClients({ page_size: 100 }),
      ]);

      if (locRes.success) {
        if (locRes.data.results) {
          setLocations(locRes.data.results);
        } else if (Array.isArray(locRes.data)) {
          setLocations(locRes.data);
        }
      } else {
        setError('Failed to fetch site locations');
      }

      if (clientRes.success) {
        const clientList = clientRes.data.results || clientRes.data;
        if (Array.isArray(clientList)) setClients(clientList);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading site records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client: clients[0]?.id || '',
      address: '',
      latitude: '12.9716',
      longitude: '77.5946',
      geofence_radius_m: '100',
      status: 'ACTIVE',
    });
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setSelectedLocation(loc);
    setFormData({
      name: loc.name || '',
      client: loc.client || loc.client_info?.id || '',
      address: loc.address || '',
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
      geofence_radius_m: loc.geofence_radius_m || '100',
      status: loc.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const rad = parseInt(formData.geofence_radius_m, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be a valid coordinate between -90 and 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return 'Longitude must be a valid coordinate between -180 and 180';
    }
    if (isNaN(rad) || rad <= 0) {
      return 'Geofence radius must be a positive integer greater than 0';
    }
    if (!formData.client) {
      return 'Please select a client organization';
    }
    return null;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const valErr = validateForm();
    if (valErr) {
      setFormError(valErr);
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await createLocation(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to create site location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const valErr = validateForm();
    if (valErr) {
      setFormError(valErr);
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await updateLocation(selectedLocation.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to update site location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Site Locations</h1>
          <p className="text-sm text-text-muted mt-1">
            Configure client deployment sites, GPS coordinates, and geofencing radiuses.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 shrink-0"
        >
          <Plus size={16} />
          <span>Add Location</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by site name or address..."
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
            onClick={fetchData}
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
          Loading site locations...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-error">
          {error}
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
            <MapPin size={24} />
          </div>
          <div className="text-sm font-medium text-text">Site Locations</div>
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
                  <th className="px-4 py-3">Site Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">GPS Coordinates</th>
                  <th className="px-4 py-3">Geofence Radius</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text">{loc.name}</td>
                    <td className="px-4 py-3 font-medium text-text-muted">
                      {loc.client_name || clients.find(c => c.id === loc.client)?.company_name || `Client #${loc.client}`}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{loc.address}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {loc.latitude}, {loc.longitude}
                    </td>
                    <td className="px-4 py-3 font-medium">{loc.geofence_radius_m} m</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          loc.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {loc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(loc)}
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

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Create Site Location</h2>
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
              <div>
                <label className="block text-xs font-medium text-text mb-1">Site / Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Client Organization *</label>
                <select
                  required
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="">Select a Client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Full Address *</label>
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
                  <label className="block text-xs font-medium text-text mb-1">Latitude (-90 to 90)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Longitude (-180 to 180)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Geofence Radius (m)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.geofence_radius_m}
                    onChange={(e) => setFormData({ ...formData, geofence_radius_m: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Edit Site Location</h2>
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
              <div>
                <label className="block text-xs font-medium text-text mb-1">Site / Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Client Organization *</label>
                <select
                  required
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="">Select a Client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Full Address *</label>
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
                  <label className="block text-xs font-medium text-text mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Geofence Radius (m)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.geofence_radius_m}
                    onChange={(e) => setFormData({ ...formData, geofence_radius_m: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
