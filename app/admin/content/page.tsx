'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LanguageIcon from '@mui/icons-material/Language';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Icon aliases
const FileText = DescriptionIcon;
const Search = SearchIcon;
const Filter = FilterListIcon;
const Plus = AddIcon;
const Edit = EditIcon;
const Trash2 = DeleteIcon;
const Eye = VisibilityIcon;
const Calendar = CalendarTodayIcon;
const User = PersonIcon;
const Tag = LocalOfferIcon;
const Globe = LanguageIcon;
const Image = ImageIcon;
const Video = VideocamIcon;
const MoreVertical = MoreVertIcon;

interface ContentItem {
  id: string;
  title: string;
  type: 'page' | 'post' | 'media' | 'product';
  status: 'published' | 'draft' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  excerpt?: string;
  featured?: boolean;
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    status: 'draft' as 'published' | 'draft' | 'archived',
    content: ''
  });

  // Fetch content from API
  useEffect(() => {
    fetchContent();
  }, [statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/content', window.location.origin);
      if (statusFilter) {
        url.searchParams.append('status', statusFilter);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      } else {
        console.error('Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle View button
  const handleView = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedContent(data.content);
        setShowViewModal(true);
      } else {
        alert('Failed to load content details');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Error loading content');
    }
  };

  // Handle Edit button
  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedContent(data.content);
        setEditFormData({
          title: data.content.title || '',
          status: data.content.status || 'draft',
          content: data.content.content || ''
        });
        setShowEditModal(true);
      } else {
        alert('Failed to load content for editing');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Error loading content');
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!selectedContent) return;

    try {
      const response = await fetch(`/api/admin/content/${selectedContent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        alert('Content updated successfully');
        setShowEditModal(false);
        fetchContent(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error updating content');
    }
  };

  // Handle Delete button
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Content deleted successfully');
        fetchContent(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error deleting content');
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page': return Globe;
      case 'post': return FileText;
      case 'media': return Image;
      case 'product': return Tag;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'bg-blue-100 text-blue-800';
      case 'post': return 'bg-purple-100 text-purple-800';
      case 'media': return 'bg-orange-100 text-orange-800';
      case 'product': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const contentStats = {
    total: content.length,
    published: content.filter(item => item.status === 'published').length,
    draft: content.filter(item => item.status === 'draft').length,
    totalViews: content.reduce((sum, item) => sum + item.views, 0)
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-500">Manage your website content, pages, and media</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add Content</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{contentStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{contentStats.published}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{contentStats.draft}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{contentStats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="page">Pages</option>
                <option value="post">Posts</option>
                <option value="media">Media</option>
                <option value="product">Products</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Loading content...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No content found
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {item.featured && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              {item.excerpt && (
                                <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                                  {item.excerpt}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{item.author}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{item.views.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleView(item.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedContent.status)}`}>
                      {selectedContent.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContent.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContent.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContent.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedContent.content || 'No content'}
                    </p>
                  </div>
                </div>

                {selectedContent.meta_title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContent.meta_title}</p>
                  </div>
                )}

                {selectedContent.meta_description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContent.meta_description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Content</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'published' | 'draft' | 'archived' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    rows={10}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter content"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 font-semibold border border-gray-300"
                  style={{ color: '#1f2937' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold shadow-md"
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}