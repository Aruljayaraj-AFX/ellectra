import React, { useState, useEffect } from 'react';
import { FolderPlus, Package, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryForm, setCategoryForm] = useState({ name: '', image: null });
  const [productForm, setProductForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    image: null
  });
  const [submitting, setSubmitting] = useState({ category: false, product: false });
  const [messages, setMessages] = useState({ category: null, product: null });

  const BASE_URL = "https://ellectra-beta.vercel.app/ellectra/v1";
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${BASE_URL}/productsall_cart`, {
        headers: { accept: "application/json" }
      });
      const data = await res.json();
      setCategories(data?.data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const showMessage = (type, text, messageType) => {
    setMessages(prev => ({ ...prev, [type]: { text, type: messageType } }));
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [type]: null }));
    }, 5000);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(prev => ({ ...prev, category: true }));

    const formData = new FormData();
    formData.append('catgories_name', categoryForm.name);
    formData.append('catgories_img', categoryForm.image);

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/new_catgories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create category.");
      }

      showMessage('category', "Category created successfully!", "success");
      setCategoryForm({ name: '', image: null });
      loadCategories();
    } catch (err) {
      showMessage('category', err.message, "error");
    } finally {
      setSubmitting(prev => ({ ...prev, category: false }));
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(prev => ({ ...prev, product: true }));

    const formData = new FormData();
    formData.append('cat_id', productForm.categoryId);
    formData.append('product_name', productForm.name);
    formData.append('product_description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('product_img', productForm.image);

    try {
      const res = await fetch(`${BASE_URL}/admin/operation/new_product`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create product.");
      }

      showMessage('product', "Product created successfully!", "success");
      setProductForm({
        categoryId: '',
        name: '',
        description: '',
        price: '',
        image: null
      });
    } catch (err) {
      showMessage('product', err.message, "error");
    } finally {
      setSubmitting(prev => ({ ...prev, product: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 pt-20 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating Background Effect */}
      <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Category Panel */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-white/10 rounded-full"></div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 relative z-10">
                <FolderPlus className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
                Add New Category
              </h2>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Enter category name"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Category Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.files[0] })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-gray-100 transition-all cursor-pointer text-base"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCategorySubmit}
                  disabled={submitting.category || !categoryForm.name || !categoryForm.image}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base uppercase tracking-wide shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting.category ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Add Category'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </div>

              {messages.category && (
                <div className={`mt-6 p-4 rounded-xl font-semibold text-center animate-slideDown ${
                  messages.category.type === 'success' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-l-4 border-green-500' 
                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-l-4 border-red-500'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {messages.category.type === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    {messages.category.text}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Panel */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-white/10 rounded-full"></div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 relative z-10">
                <Package className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
                Add New Product
              </h2>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Select Category
                  </label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-base"
                  >
                    <option value="">
                      {loadingCategories ? 'Loading categories...' : 'Choose a category...'}
                    </option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Product Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Enter product description"
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all resize-vertical text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Price
                  </label>
                  <input
                    type="text"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="Enter price"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.files[0] })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-gray-100 transition-all cursor-pointer text-base"
                  />
                </div>

                <button
                  onClick={handleProductSubmit}
                  disabled={submitting.product || !productForm.categoryId || !productForm.name || !productForm.description || !productForm.price || !productForm.image}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base uppercase tracking-wide shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting.product ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Add Product'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </div>

              {messages.product && (
                <div className={`mt-6 p-4 rounded-xl font-semibold text-center animate-slideDown ${
                  messages.product.type === 'success' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-l-4 border-green-500' 
                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-l-4 border-red-500'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {messages.product.type === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    {messages.product.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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