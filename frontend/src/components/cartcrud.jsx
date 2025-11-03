import React, { useState, useEffect } from 'react';
import { FolderPlus, Edit2, Trash2, Loader2, CheckCircle, AlertCircle, X, Save, Search, ImageIcon } from 'lucide-react';

export default function CategoryCRUD() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', image: null, imagePreview: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const BASE_URL = "https://ellectra-beta.vercel.app/ellectra/v1";
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/productsall_cart`, {
        headers: { 
          accept: "application/json"
        }
      });
      const data = await res.json();
      setCategories(data?.data || []);
    } catch (err) {
      showMessage("Failed to load categories", "error");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('catgories_name', formData.name);
    formDataToSend.append('catgories_img', formData.image);

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/new_catgories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!res.ok) throw new Error("Failed to create category");

      showMessage("Category created successfully!", "success");
      setShowAddModal(false);
      setFormData({ name: '', image: null, imagePreview: null });
      loadCategories();
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('cat_id', editingCategory.category_id);
    formDataToSend.append('catgories_name', formData.name);
    if (formData.image) {
      formDataToSend.append('catgories_img', formData.image);
    }

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/edit_catgories`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!res.ok) throw new Error("Failed to update category");

      showMessage("Category updated successfully!", "success");
      setEditingCategory(null);
      setFormData({ name: '', image: null, imagePreview: null });
      loadCategories();
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/delete_catgories?catgories_id=${categoryId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete category");

      showMessage("Category deleted successfully!", "success");
      loadCategories();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.category_name,
      image: null,
      imagePreview: category.category_Img
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', image: null, imagePreview: null });
  };

  const filteredCategories = categories.filter(cat =>
    cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                Category Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Manage your product categories</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg font-medium animate-slideDown border ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-gray-600 animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
            <p className="text-gray-500">Get started by creating your first category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCategories.map((category) => (
              <div
                key={category.category_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {editingCategory?.category_id === category.category_id ? (
                  <div className="p-5">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Image</label>
                        {formData.imagePreview && (
                          <img src={formData.imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2 border border-gray-200" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer text-sm"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleUpdate}
                          disabled={submitting}
                          className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative h-48 bg-gray-100">
                      {category.category_Img ? (
                        <img
                          src={category.category_Img}
                          alt={category.category_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 truncate" title={category.category_name}>
                        {category.category_name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(category)}
                          className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.category_id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="bg-gray-900 p-5 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FolderPlus className="w-5 h-5" />
                    Add New Category
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Image</label>
                  {formData.imagePreview && (
                    <img src={formData.imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3 border border-gray-200" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={submitting || !formData.name || !formData.image}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium shadow-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}