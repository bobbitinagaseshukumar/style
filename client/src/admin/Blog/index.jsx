import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: 'StyleVerse Editorial',
    category: 'Fashion Trends',
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/blog');
      setPosts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/blog/admin', form);
      toast.success('Article published!');
      setModalOpen(false);
      setForm({ title: '', excerpt: '', content: '', coverImage: '', author: 'StyleVerse Editorial', category: 'Fashion Trends' });
      fetchPosts();
    } catch (err) {
      toast.error('Failed to publish post');
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await api.delete(`/blog/admin/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal-900">Blog & Editorial CMS</h1>
          <p className="text-xs text-gray-500">Publish fashion guides, saree draping articles, and trends</p>
        </div>
        <Button icon={FiPlus} onClick={() => setModalOpen(true)}>Create Article</Button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-4">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author</th>
              <th className="p-3">Published Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-charcoal-900">{p.title}</td>
                <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 font-bold text-[10px]">{p.category}</span></td>
                <td className="p-3">{p.author}</td>
                <td className="p-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDeletePost(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No blog articles published.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Publish Blog Article">
        <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
          <Input label="Article Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 5 Classic Ways to Style Silk Sarees" />
          <Input label="Short Excerpt" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief 1-sentence summary" />
          <Input label="Cover Image URL" value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://images.unsplash.com/..." />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full HTML / Text Content</label>
            <textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required className="w-full p-3 rounded-xl border border-gray-300" placeholder="Write full article body..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish Now</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBlog;
