import React, { useState, useEffect } from 'react';
import { Package, MapPin, CreditCard, Truck, Calendar, Phone, Mail, User, Edit2, Check, X, ChevronRight, ArrowLeft, Search, Filter, RefreshCw, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';

const OrderManagementSystem = () => {
  const [view, setView] = useState('list');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    payment_status: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 0,
    has_more: false
  });

  const API_BASE_URL = 'https://ellectra-beta.vercel.app/ellectra/v1';
  const token = localStorage.getItem('token');

  const paymentStatusOptions = ["Pending", "Successfully"];
  const orderStatusOptions = ["Pending", "Out for Delivery", "Delivered"];

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchOrders = async (page = 1, status = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_BASE_URL}/past_order/view?page=${page}&limit=${pagination.limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch orders');
      }
      
      const data = await response.json();
      
      if (data.message === "No orders found" || !data.past_orders) {
        setOrders([]);
        setPagination({
          page: 1,
          limit: 20,
          total_items: 0,
          total_pages: 0,
          has_more: false
        });
      } else {
        setOrders(data.past_orders || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/past_order/view/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch order details');
      }
      
      const data = await response.json();
      setSelectedOrder(data);
      setEditForm({
        payment_status: data.payment_status,
        status: data.status
      });
      setView('details');
    } catch (err) {
      console.error('Fetch order details error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/past_order/update-status/${selectedOrder.order_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_status: editForm.payment_status,
            status: editForm.status
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update status');
      }
      
      const updatedOrder = {
        ...selectedOrder,
        payment_status: editForm.payment_status,
        status: editForm.status
      };
      
      setSelectedOrder(updatedOrder);
      setOrders(orders.map(o => 
        o.order_id === selectedOrder.order_id 
          ? { ...o, payment_status: editForm.payment_status, status: editForm.status }
          : o
      ));
      
      setIsEditing(false);
      setSuccessMessage('Status updated successfully!');
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out for Delivery": "bg-blue-100 text-blue-800 border-blue-300",
      "Delivered": "bg-green-100 text-green-800 border-green-300",
      "Successfully": "bg-green-100 text-green-800 border-green-300"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusIcon = (status) => {
    if (status === "Delivered" || status === "Successfully") {
      return <CheckCircle className="w-4 h-4" />;
    } else if (status === "Out for Delivery") {
      return <Truck className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const Alert = ({ type, message, onClose }) => {
    const styles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800"
    };

    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <AlertCircle className="w-5 h-5" />
    };

    return (
      <div className={`fixed top-4 right-4 z-50 ${styles[type]} border rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md`}>
        {icons[type]}
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (view === 'details' && selectedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-30 py-8 px-4 sm:px-6 lg:px-8">
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        )}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => {
                setView('list');
                setIsEditing(false);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors px-4 py-2 hover:bg-white rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </button>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
                  <p className="text-gray-600">
                    Order ID: <span className="font-semibold text-indigo-600">{selectedOrder.order_id}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedOrder.order_date)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Order Items ({selectedOrder.total_items})</h2>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 transition-all border border-gray-200">
                      <img 
                        src={item.product_img} 
                        alt={item.product_name}
                        className="w-24 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.product_name}</h3>
                        <p className="text-xs text-gray-500 mb-2">ID: {item.pro_id}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-gray-700">
                            <span className="font-medium">Price:</span> {formatCurrency(item.price_per_item)}
                          </span>
                          <span className="text-gray-700">
                            <span className="font-medium">Qty:</span> {item.quantity}
                          </span>
                          <span className="font-semibold text-indigo-600">
                            Total: {formatCurrency(item.item_total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Delivery Type
                      </p>
                      <p className="font-semibold text-gray-900">{selectedOrder.delivery_type}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        City
                      </p>
                      <p className="font-semibold text-gray-900">{selectedOrder.city}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.delivery_address}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Pincode</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.pincode}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Landmark</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.landmark || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Truck className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Status</h2>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order Status</p>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrder.payment_status)}`}>
                        {getStatusIcon(selectedOrder.payment_status)}
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {orderStatusOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                      <select
                        value={editForm.payment_status}
                        onChange={(e) => setEditForm({...editForm, payment_status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {paymentStatusOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={updateOrderStatus}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditForm({
                            payment_status: selectedOrder.payment_status,
                            status: selectedOrder.status
                          });
                          setIsEditing(false);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Customer Info</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.user_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900 break-all">{selectedOrder.user_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.user_phoneno}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({selectedOrder.total_items} items)</span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-30 py-8 px-4 sm:px-6 lg:px-8">
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Package className="w-8 h-8 text-indigo-600" />
                My Orders
              </h1>
              <p className="text-gray-600">
                {filteredOrders.length} order(s) found
                {pagination.total_items > 0 && ` • Total: ${pagination.total_items}`}
              </p>
            </div>
            <button
              onClick={() => fetchOrders(pagination.page, filterStatus)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  fetchOrders(1, e.target.value === 'all' ? null : e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="all">All Orders</option>
                <option value="Pending">Pending</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'You haven\'t placed any orders yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-100 hover:border-indigo-200"
                  onClick={() => fetchOrderDetails(order.order_id)}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{order.order_id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(order.payment_status)}`}>
                            {getStatusIcon(order.payment_status)}
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            {order.delivery_type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.total_pages > 1 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => fetchOrders(pagination.page - 1, filterStatus === 'all' ? null : filterStatus)}
                    disabled={pagination.page === 1 || loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => fetchOrders(pagination.page + 1, filterStatus === 'all' ? null : filterStatus)}
                    disabled={!pagination.has_more || loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderManagementSystem