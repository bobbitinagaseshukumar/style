import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../config/api';
import {
  FiTrash2, FiPlus, FiChevronDown, FiChevronRight,
  FiTag, FiGrid, FiEdit, FiAlertTriangle, FiX, FiCheck
} from 'react-icons/fi';
import { toast } from 'react-toastify';

/* ─── Add/Edit Category Form ──────────────────────────────────── */
const CategoryForm = ({ initial, onSubmit, onCancel, saving }) => {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <Input label="Category Name *" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Women's Sarees" />
      <Input label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Brief description" />
      <Input label="Thumbnail Image URL" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
      <Input label="Banner Image URL" name="banner" value={form.banner} onChange={handleChange} placeholder="https://..." />
      <Input label="Display Order" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} placeholder="0" />
      <div className="flex justify-end gap-3 pt-3 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (initial.name ? 'Update Category' : 'Create Category')}</Button>
      </div>
    </form>
  );
};

/* ─── Add Subcategory Form (inline) ──────────────────────────── */
const SubCategoryForm = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 rounded-xl border border-dashed border-yellow-300">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Subcategory name..."
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(name, image, setSaving); }}}
        autoFocus
      />
      <input
        type="text"
        value={image}
        onChange={e => setImage(e.target.value)}
        placeholder="Image URL (optional)"
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onAdd(name, image, setSaving)}
        disabled={saving || !name.trim()}
        className="p-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition disabled:opacity-50"
      >
        <FiCheck size={14} />
      </button>
      <button type="button" onClick={onCancel} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
        <FiX size={14} />
      </button>
    </div>
  );
};

/* ─── Single Category Card ────────────────────────────────────── */
const CategoryCard = ({ category, onDelete, onEdit, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);

  const loadSubs = async () => {
    if (subs.length > 0) return; // already loaded
    try {
      setLoadingSubs(true);
      const { data } = await api.get(`/categories/${category.id}/subcategories`);
      setSubs(data.data || []);
    } catch {
      toast.error('Failed to load subcategories');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadSubs();
  };

  const handleAddSub = async (name, image, setSaving) => {
    if (!name.trim()) { toast.error('Subcategory name required'); return; }
    try {
      setSaving(true);
      const { data } = await api.post(`/categories/${category.id}/subcategories`, { name: name.trim(), image });
      setSubs(prev => [...prev, data.data]);
      setShowAddSub(false);
      toast.success(`"${name}" subcategory added`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subcategory');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSub = async (sub) => {
    try {
      setDeletingSubId(sub.id);
      await api.delete(`/categories/subcategories/${sub.id}`);
      setSubs(prev => prev.filter(s => s.id !== sub.id));
      toast.success(`"${sub.name}" removed`);
    } catch {
      toast.error('Failed to delete subcategory');
    } finally {
      setDeletingSubId(null);
    }
  };

  const img = category.image
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=D4AF37&color=fff&size=128`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Category image & actions */}
      <div className="relative">
        <img src={img} alt={category.name} className="w-full h-36 object-cover bg-gray-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            onClick={() => onEdit(category)}
            className="w-7 h-7 rounded-lg bg-white/90 text-blue-600 flex items-center justify-center hover:bg-white transition shadow"
            title="Edit category"
          >
            <FiEdit size={12} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition shadow"
            title="Delete category"
          >
            <FiTrash2 size={12} />
          </button>
        </div>
        <div className="absolute bottom-2 left-3">
          <span className="text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">
            {category._count?.products || 0} products
          </span>
        </div>
      </div>

      {/* Category info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base">{category.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{category.description || 'No description'}</p>
        <p className="text-[10px] text-gray-300 font-mono mt-1">/{category.slug}</p>

        {/* Subcategory toggle */}
        <button
          onClick={handleExpand}
          className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700 hover:bg-yellow-50 hover:border-yellow-200 transition"
        >
          <span className="flex items-center gap-2 font-medium">
            <FiTag size={12} className="text-yellow-500" />
            Subcategories
            {subs.length > 0 && (
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 rounded-full">{subs.length}</span>
            )}
          </span>
          {expanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
        </button>

        {/* Subcategory panel */}
        {expanded && (
          <div className="mt-3">
            {loadingSubs ? (
              <div className="text-xs text-gray-400 text-center py-3">Loading...</div>
            ) : (
              <>
                {subs.length === 0 && !showAddSub && (
                  <p className="text-xs text-gray-400 text-center py-3 italic">No subcategories yet</p>
                )}
                <div className="space-y-1.5">
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium truncate">{sub.name}</span>
                        <span className="text-[10px] text-gray-400">({sub._count?.products || 0})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSub(sub)}
                        disabled={deletingSubId === sub.id}
                        className="p-1 rounded text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                        title="Remove subcategory"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {showAddSub ? (
                  <SubCategoryForm
                    onAdd={handleAddSub}
                    onCancel={() => setShowAddSub(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddSub(true)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-yellow-200 text-yellow-600 text-xs font-semibold hover:border-yellow-400 hover:bg-yellow-50 transition"
                  >
                    <FiPlus size={12} /> Add Subcategory
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Admin Categories Page ─────────────────────────────── */
const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const EMPTY = { name: '', description: '', image: '', banner: '', sortOrder: '0' };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditingCategory(null); setIsModalOpen(true); };
  const openEdit = (cat) => { setEditingCategory(cat); setIsModalOpen(true); };

  const handleSubmit = async (form) => {
    try {
      setSaving(true);
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { ...form, sortOrder: parseInt(form.sortOrder || 0) });
        toast.success('Category updated!');
      } else {
        await api.post('/categories', { ...form, sortOrder: parseInt(form.sortOrder || 0) });
        toast.success('Category created!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/categories/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete. Remove all products first.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500">Click any category to expand and manage its subcategories</p>
        </div>
        <Button icon={FiPlus} onClick={openAdd}>Add Category</Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <FiGrid size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">No categories yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first category to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onDelete={setDeleteTarget}
              onEdit={openEdit}
              onRefresh={fetchCategories}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-red-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-500">This will also delete all subcategories.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              Delete <strong>"{deleteTarget.name}"</strong>? Remove all its products first.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? 'Deleting...' : (<><FiTrash2 size={13} /> Delete</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}
      >
        <CategoryForm
          initial={editingCategory ? {
            name: editingCategory.name || '',
            description: editingCategory.description || '',
            image: editingCategory.image || '',
            banner: editingCategory.banner || '',
            sortOrder: String(editingCategory.sortOrder || 0),
          } : EMPTY}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          saving={saving}
        />
      </Modal>
    </div>
  );
};

export default AdminCategories;
