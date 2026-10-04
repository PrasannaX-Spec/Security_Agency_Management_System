import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, ToggleLeft, ToggleRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { getClients, createClient, updateClient, updateClientStatus } from '../api/masterData';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE',
  });

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await getClients(params);
      if (response.success) {
        if (response.data.results) {
          setClients(response.data.results);
        } else if (Array.isArray(response.data)) {
          setClients(response.data);
        }
      } else {
        setError('Failed to fetch client records');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading client records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVE',
    });
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      username: client.user_info?.username || '',
      password: '',
      company_name: client.company_name || '',
      contact_person: client.contact_person || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      status: client.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await createClient(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchClients();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to create client');
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
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        status: formData.status,
      };
      const res = await updateClient(selectedClient.id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchClients();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (client) => {
    const nextStatus = client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await updateClientStatus(client.id, nextStatus);
      if (res.success) {
        fetchClients();
      }
    } catch (err) {
      alert('Failed to update client status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Client Accounts</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage client organization accounts, contact representatives, and access permissions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 shrink-0"
        >
          <Plus size={16} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by company or contact person..."
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
            onClick={fetchClients}
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
          Loading client accounts...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-error">
          {error}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
            <Building2 size={24} />
          </div>
          <div className="text-sm font-medium text-text">Client Accounts</div>
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
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text">{client.company_name}</td>
                    <td className="px-4 py-3 font-medium">{client.contact_person}</td>
                    <td className="px-4 py-3 text-text-muted">{client.phone}</td>
                    <td className="px-4 py-3 text-text-muted">{client.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          client.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-background"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(client)}
                        className={`inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium ${
                          client.status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-500/10'
                            : 'text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                      >
                        {client.status === 'ACTIVE' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                        {client.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Register New Client Account</h2>
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
                  <label className="block text-xs font-medium text-text mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
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
                  <label className="block text-xs font-medium text-text mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Office Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
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
                  {isSubmitting ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Edit Client Details</h2>
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
                  <label className="block text-xs font-medium text-text mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
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
                  <label className="block text-xs font-medium text-text mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Office Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
