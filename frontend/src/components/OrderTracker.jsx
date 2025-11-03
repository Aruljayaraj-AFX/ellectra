import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CreditCard, Truck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function OrderTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/ellectra/v1/past_order/view', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders. Please try again.');
      }

      const data = await response.json();
      setOrders(data.past_orders || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '✓';
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙';
      case 'cancelled':
        return '✕';
      default:
        return '•';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <Package className="w-8 h-8 text-violet-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">Loading your orders...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
          <div className="text-center">
            <div className="bg-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchOrders}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-white rounded-2xl px-6 py-3 shadow-lg mb-6">
            <Package className="w-8 h-8 text-violet-600 inline-block" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3 tracking-tight">Your Orders</h1>
          <p className="text-gray-600 text-lg">Track and manage all your purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 sm:p-16 text-center border border-gray-100">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">No Orders Yet</h2>
            <p className="text-gray-500 text-lg">Start shopping to see your orders here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-violet-100 text-sm font-medium mb-1">Order ID</p>
                      <p className="text-white text-xl sm:text-2xl font-bold tracking-wide">{order.order_id}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-sm font-bold border-2 inline-flex items-center gap-2 self-start sm:self-auto ${getStatusColor(order.payment_status)}`}>
                      <span className="text-lg">{getStatusIcon(order.payment_status)}</span>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0 mx-auto lg:mx-0">
                      <div className="relative group">
                        <img
                          src={order.product_img}
                          alt={order.product_name}
                          className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl border-4 border-gray-100 shadow-md group-hover:shadow-xl transition-all"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>

                    <div className="flex-grow space-y-6">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 leading-tight">{order.product_name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-gray-600">
                          <span className="bg-violet-50 px-4 py-2 rounded-lg font-semibold text-violet-700">
                            Qty: {order.quantity}
                          </span>
                          <span className="text-lg">₹{order.price_per_item.toFixed(2)} <span className="text-gray-500 text-base">per item</span></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                          <div className="bg-violet-100 p-3 rounded-lg">
                            <Calendar className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Order Date</p>
                            <p className="font-bold text-gray-800">{formatDate(order.order_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                          <div className="bg-violet-100 p-3 rounded-lg">
                            <Truck className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Delivery Type</p>
                            <p className="font-bold text-gray-800 capitalize">{order.delivery_type}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl sm:col-span-2">
                          <div className="bg-violet-100 p-3 rounded-lg">
                            <MapPin className="w-6 h-6 text-violet-600" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm text-gray-500 font-medium mb-1">Delivery Address</p>
                            <p className="font-bold text-gray-800">{order.delivery_address}</p>
                            <p className="text-gray-600 mt-1">{order.city}, {order.pincode}</p>
                            {order.landmark && <p className="text-gray-600 text-sm mt-1">Landmark: {order.landmark}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-xl border-2 border-violet-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-violet-600 p-3 rounded-lg">
                              <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                              <p className="text-3xl sm:text-4xl font-bold text-violet-700">₹{order.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
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