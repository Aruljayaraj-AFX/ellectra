import React, { useState, useEffect } from 'react';
import { Package, MapPin, CreditCard, Truck, Calendar, Phone, Mail, User, Edit2, Check, X, ChevronRight, ArrowLeft, Search, Filter, RefreshCw } from 'lucide-react';

const OrderManagementSystem = () => {
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    payment_status: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const API_BASE_URL = 'https://ellectra-beta.vercel.app/ellectra/v1';
  const token = localStorage.getItem('token'); // Get token from localStorage

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/past_order/view`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      
      const data = await response.json();
      
      // Handle the response structure from your API
      if (data.message === "No orders found") {
        setOrders([]);
      } else {
        setOrders(data.past_orders || []);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message);
      // Use sample data for demo when API fails
      setOrders(generateSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  // Fetch single order details
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
        throw new Error(errorData.message || 'Failed to fetch order details');
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
      // Use sample data for demo when API fails
      const sampleOrder = orders.find(o => o.order_id === orderId);
      if (sampleOrder) {
        setSelectedOrder(sampleOrder);
        setEditForm({
          payment_status: sampleOrder.payment_status,
          status: sampleOrder.status
        });
        setView('details');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
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
        throw new Error(errorData.message || 'Failed to update status');
      }
      
      const data = await response.json();
      
      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        payment_status: editForm.payment_status,
        status: editForm.status
      });
      
      // Update orders list
      setOrders(orders.map(o => 
        o.order_id === selectedOrder.order_id 
          ? { ...o, payment_status: editForm.payment_status, status: editForm.status }
          : o
      ));
      
      setIsEditing(false);
      alert('✅ Status updated successfully!');
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message);
      alert('Error: ' + err.message);
      // For demo, still update locally if API fails
      setSelectedOrder({
        ...selectedOrder,
        payment_status: editForm.payment_status,
        status: editForm.status
      });
      setOrders(orders.map(o => 
        o.order_id === selectedOrder.order_id 
          ? { ...o, payment_status: editForm.payment_status, status: editForm.status }
          : o
      ));
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper functions
  const getStatusColor = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out for Delivery": "bg-blue-100 text-blue-800 border-blue-300",
      "Delivered": "bg-green-100 text-green-800 border-green-300",
      "Successfully": "bg-green-100 text-green-800 border-green-300"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Generate sample data for demo
  const paymentStatusOptions = ["Pending", "Successfully"];
  const orderStatusOptions = ["Pending", "Out for Delivery", "Delivered"];

  if (view === 'details' && selectedOrder) {
    return <OrderDetailsView />;
  }

  return <OrderListView />;

  // ORDER LIST VIEW
  function OrderListView() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
                <p className="text-gray-600">{filteredOrders.length} order(s) found</p>
              </div>
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Orders</option>
                  <option value="Pending">Pending</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Orders List */}
          {loading && orders.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => fetchOrderDetails(order.order_id)}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{order.order_id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border {getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border {getStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.order_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {order.total_items} item(s)
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {order.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            {order.delivery_type}
                          </div>
                        </div>
                      </div>

                      {/* Amount and Action */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>

                    {/* Quick Preview of Items */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-2 overflow-x-auto">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.product_img}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg shadow-sm"
                          />
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-sm font-semibold">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ORDER DETAILS VIEW
  function OrderDetailsView() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button & Header */}
          <div className="mb-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </button>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
                  <p className="text-gray-600">Order ID: <span className="font-semibold text-gray-900">{selectedOrder.order_id}</span></p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedOrder.order_date)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Order Items ({selectedOrder.total_items})</h2>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <img 
                        src={item.product_img} 
                        alt={item.product_name}
                        className="w-24 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.product_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">ID: {item.pro_id}</p>
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

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Delivery Type</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.delivery_type}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">City</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.city}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.delivery_address}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Pincode</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.pincode}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Landmark</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.landmark || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Status & Customer Info */}
            <div className="space-y-6">
              {/* Status Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Truck className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Status</h2>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order Status</p>
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold border {getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold border {getStatusColor(selectedOrder.payment_status)}`}>
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
                        <Check className="w-4 h-4" />
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

              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
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

              {/* Payment Summary */}
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
};

export default OrderManagementSystem;