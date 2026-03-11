'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2, AlertCircle, FileText } from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  const fetchAnnouncements = async () => {
    const res = await fetch('http://localhost:4200/api/v1/announcements');
    const data = await res.json();
    setAnnouncements(data);
  };

  const fetchStats = async () => {
    const res = await fetch('http://localhost:4200/api/v1/announcements/stats');
    const data = await res.json();
    setStats(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const url = editingAnnouncement
      ? `http://localhost:4200/api/v1/announcements/${editingAnnouncement.id}`
      : 'http://localhost:4200/api/v1/announcements';

    await fetch(url, {
      method: editingAnnouncement ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setShowModal(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
    fetchStats();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this announcement?')) {
      await fetch(`http://localhost:4200/api/v1/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
      fetchStats();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-600 mt-1">Communicate with your team</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingAnnouncement(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Announcements</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <Megaphone className="text-cyan-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.published}</p>
            </div>
            <FileText className="text-green-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Drafts</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.draft}</p>
            </div>
            <AlertCircle className="text-orange-500" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    announcement.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {announcement.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    announcement.priority === 'high' ? 'bg-red-100 text-red-700' :
                    announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {announcement.priority} priority
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{announcement.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Type: {announcement.type}</span>
                  <span>•</span>
                  <span>Audience: {announcement.targetAudience}</span>
                  <span>•</span>
                  <span>Published: {new Date(announcement.publishDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setEditingAnnouncement(announcement); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDelete(announcement.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input name="title" defaultValue={editingAnnouncement?.title} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                  <textarea name="content" defaultValue={editingAnnouncement?.content} required rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select name="type" defaultValue={editingAnnouncement?.type} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                      <option value="">Select Type</option>
                      <option value="general">General</option>
                      <option value="event">Event</option>
                      <option value="holiday">Holiday</option>
                      <option value="policy">Policy Update</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                    <select name="priority" defaultValue={editingAnnouncement?.priority || 'normal'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
                  <select name="targetAudience" defaultValue={editingAnnouncement?.targetAudience || 'all'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="all">All Employees</option>
                    <option value="department">Specific Department</option>
                    <option value="branch">Specific Branch</option>
                    <option value="management">Management Only</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date *</label>
                    <input name="publishDate" type="date" defaultValue={editingAnnouncement?.publishDate} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={editingAnnouncement?.expiryDate} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select name="status" defaultValue={editingAnnouncement?.status || 'published'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingAnnouncement(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
