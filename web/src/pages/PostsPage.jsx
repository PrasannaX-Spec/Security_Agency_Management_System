import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Search, Edit2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { getPosts, createPost, updatePost, getLocations } from '../api/masterData';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    location: '',
    name: '',
    required_guards: '1',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [postRes, locRes] = await Promise.all([
        getPosts(params),
        getLocations({ page_size: 100 }),
      ]);

      if (postRes.success) {
        if (postRes.data.results) {
          setPosts(postRes.data.results);
        } else if (Array.isArray(postRes.data)) {
          setPosts(postRes.data);
        }
      } else {
        setError('Failed to fetch duty posts');
      }

      if (locRes.success) {
        const locList = locRes.data.results || locRes.data;
        if (Array.isArray(locList)) setLocations(locList);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading duty post records');
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
      location: locations[0]?.id || '',
      name: '',
      required_guards: '1',
      status: 'ACTIVE',
    });
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setSelectedPost(post);
    setFormData({
      location: post.location || post.location_info?.id || '',
      name: post.name || '',
      required_guards: post.required_guards || '1',
      status: post.status || 'ACTIVE',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    const guardsCount = parseInt(formData.required_guards, 10);
    if (isNaN(guardsCount) || guardsCount < 1) {
      return 'Required guards count must be at least 1 guard';
    }
    if (!formData.location) {
      return 'Please select a site location';
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
      const res = await createPost(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to create duty post');
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
      const res = await updatePost(selectedPost.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        setFormError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } catch (err) {
      setFormError(err.response?.data?.error ? JSON.stringify(err.response.data.error) : 'Failed to update duty post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Duty Posts</h1>
          <p className="text-sm text-text-muted mt-1">
            Define specific guard duty checkpoints and required personnel counts per site location.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors duration-150 shrink-0"
        >
          <Plus size={16} />
          <span>Add Duty Post</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search post name..."
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
          Loading duty posts...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-error">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-background text-text-muted mb-3">
            <ShieldAlert size={24} />
          </div>
          <div className="text-sm font-medium text-text">Duty Posts</div>
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
                  <th className="px-4 py-3">Duty Post Name</th>
                  <th className="px-4 py-3">Site Location</th>
                  <th className="px-4 py-3">Required Guards</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text">{post.name}</td>
                    <td className="px-4 py-3 font-medium text-text-muted">
                      {post.location_name || locations.find(l => l.id === post.location)?.name || `Location #${post.location}`}
                    </td>
                    <td className="px-4 py-3 font-medium">{post.required_guards} guards</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          post.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(post)}
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

      {/* Add Duty Post Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Create Duty Post</h2>
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
                <label className="block text-xs font-medium text-text mb-1">Site Location *</label>
                <select
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="">Select Location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Duty Post Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Main Gate Checkpoint A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Required Guards Count *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.required_guards}
                  onChange={(e) => setFormData({ ...formData, required_guards: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Duty Post Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">Edit Duty Post</h2>
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
                <label className="block text-xs font-medium text-text mb-1">Site Location *</label>
                <select
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="">Select Location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Duty Post Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">Required Guards Count *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.required_guards}
                  onChange={(e) => setFormData({ ...formData, required_guards: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
