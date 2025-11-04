import React, { useState, useEffect } from 'react';
import { 
  Package, Edit2, Trash2, Loader2, CheckCircle, AlertCircle, 
  X, Save, Search, Image 
} from 'lucide-react';

export default function ProductCRUD() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ 
    categoryId: '', 
    name: '', 
    description: '', 
    price: '', 
    image: null, 
    imagePreview: null 
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const BASE_URL = "https://ellectra-beta.vercel.app/ellectra/v1";

  const token = localStorage.getItem("token");

  const formatPrice = (price) => 
    `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts();
    }
  }, [selectedCategory]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/productsall_cart`, { 
        headers: { accept: "application/json" } 
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCategories(data?.data || []);
      if (data?.data?.length > 0) {
        setSelectedCategory(String(data.data[0].category_id));
      }
    } catch (err) {
      console.error('Load categories error:', err);
      showMessage("Failed to load categories: " + err.message, "error");
    }
  };

  const loadProducts = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/products/pro_info?catgories_id=${selectedCategory}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data?.data || []);
    } catch (err) {
      console.error('Load products error:', err);
      showMessage("Failed to load products: " + err.message, "error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage("Please select a valid image file", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMessage("Image size must be less than 5MB", "error");
        return;
      }
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.categoryId || !formData.name.trim() || !formData.description.trim() || !formData.price || !formData.image) {
      showMessage("All fields are required", "error");
      return;
    }
    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('cat_id', formData.categoryId);
    formDataToSend.append('product_name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('price', formData.price);
    formDataToSend.append('product_img', formData.image);

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/new_product`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData?.detail || responseData?.message || "Failed to create product");

      showMessage("✅ Product created successfully!", "success");
      setShowAddModal(false);
      setFormData({ categoryId: '', name: '', description: '', price: '', image: null, imagePreview: null });
      loadProducts();
    } catch (err) {
      console.error('Create error:', err);
      showMessage(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.categoryId || !formData.name.trim() || !formData.description.trim() || !formData.price) {
      showMessage("All fields are required", "error");
      return;
    }

    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('pro_id', String(editingProduct.product_id));
    formDataToSend.append('cat_id', formData.categoryId);
    formDataToSend.append('product_name', formData.name.trim());
    formDataToSend.append('product_description', formData.description.trim());
    formDataToSend.append('price', formData.price);

    if (formData.image) {
      formDataToSend.append('product_img', formData.image);
    } else if (editingProduct.product_img) {
      try {
        const imageResponse = await fetch(editingProduct.product_img);
        const imageBlob = await imageResponse.blob();
        const fileName = editingProduct.product_img.split('/').pop() || 'image.jpg';
        const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });
        formDataToSend.append('product_img', imageFile);
      } catch (imgErr) {
        showMessage("Error loading existing image", "error");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/edit_product`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData?.detail || responseData?.message || "Failed to update product");

      showMessage("✅ Product updated successfully!", "success");
      setEditingProduct(null);
      setFormData({ categoryId: '', name: '', description: '', price: '', image: null, imagePreview: null });
      loadProducts();
    } catch (err) {
      console.error('Update error:', err);
      showMessage(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/operation/delete_product?product_id=${productId}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData?.detail || responseData?.message || "Failed to delete product");

      showMessage("🗑️ Product deleted successfully!", "success");
      loadProducts();
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      categoryId: String(product.category_id || ''),
      name: product.product_name || '',
      description: product.description || '',
      price: String(product.price || ''),
      image: null,
      imagePreview: product.product_img || null
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({ categoryId: '', name: '', description: '', price: '', image: null, imagePreview: null });
  };

  const filteredProducts = products.filter(prod =>
    prod.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage your product inventory with ease</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
            >
              <option value="">Select a Category</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
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
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-gray-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchTerm ? 'No products found' : 'No products in this category'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Add your first product to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {editingProduct?.product_id === product.product_id ? (
                  <EditProductForm 
                    formData={formData} 
                    setFormData={setFormData} 
                    categories={categories}
                    handleImageChange={handleImageChange}
                    handleUpdate={handleUpdate}
                    cancelEdit={cancelEdit}
                    submitting={submitting}
                  />
                ) : (
                  <ProductCard 
                    product={product} 
                    startEdit={startEdit} 
                    handleDelete={handleDelete} 
                    submitting={submitting} 
                    formatPrice={formatPrice}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddProductModal 
            setShowAddModal={setShowAddModal}
            categories={categories}
            formData={formData}
            setFormData={setFormData}
            handleCreate={handleCreate}
            handleImageChange={handleImageChange}
            submitting={submitting}
          />
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
}

function ProductCard({ product, startEdit, handleDelete, submitting, formatPrice }) {
  return (
    <>
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {product.product_img ? (
          <img src={product.product_img} alt={product.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate" title={product.product_name}>
          {product.product_name}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2" title={product.description}>
          {product.description}
        </p>
        <p className="text-xl font-bold text-gray-900 mb-3">{formatPrice(product.price)}</p>
        <div className="flex gap-2">
          <button 
            onClick={() => startEdit(product)} 
            disabled={submitting}
            className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button 
            onClick={() => handleDelete(product.product_id)} 
            disabled={submitting}
            className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </>
  );
}

function EditProductForm({ formData, setFormData, categories, handleImageChange, handleUpdate, cancelEdit, submitting }) {
  return (
    <div className="p-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {formData.imagePreview && (
            <div className="mb-2 relative h-32 rounded-lg overflow-hidden border border-gray-200">
              <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer cursor-pointer"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleUpdate}
            disabled={submitting}
            className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            disabled={submitting}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ setShowAddModal, categories, formData, setFormData, handleCreate, handleImageChange, submitting }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none resize-none"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
              {formData.imagePreview && (
                <div className="mb-2 relative h-40 rounded-lg overflow-hidden border border-gray-200">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported: JPG, PNG, GIF</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}