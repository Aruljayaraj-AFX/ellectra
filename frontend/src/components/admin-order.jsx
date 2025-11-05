import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, MapPin, Calendar, DollarSign, Truck, XCircle, Eye, X, AlertCircle, Clock, CreditCard, CheckCircle } from 'lucide-react';

const PendingOrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [apiToken, setApiToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setApiToken(token);
      fetchPendingOrders(token);
    } else {
      setError('Please login first. Token not found.');
      setLoading(false);
    }
  }, []);

  const fetchPendingOrders = async (token = apiToken) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://ellectra-beta.vercel.app/ellectra/v1/past_order/view', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.message && data.message.includes('no past orders')) {
        setOrders([]);
      } else if (data.past_orders) {
        const pendingOrders = data.past_orders.filter(order => {
          const statusLower = order.status?.toLowerCase() || '';
          const paymentLower = order.payment_status?.toLowerCase() || '';
          return statusLower !== 'delivered' && paymentLower !== 'successfully';
        });
        setOrders(pendingOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, newPaymentStatus) => {
    setUpdating(true);
    
    try {
      const payload = {};
      if (newPaymentStatus) payload.payment_status = newPaymentStatus;
      if (newStatus) payload.status = newStatus;

      const response = await fetch(`https://ellectra-beta.vercel.app/ellectra/v1/past_order/update-status/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update order');
      }

      const data = await response.json();
      
      await fetchPendingOrders();
      
      setSelectedOrder(null);
      alert(data.message || 'Order status updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update order status. Please try again.');
      console.error('Update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OrderDetailModal = ({ order, onClose, onUpdate }) => {
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
    const [orderStatus, setOrderStatus] = useState(order.status);
    const [imagePreview, setImagePreview] = useState(false);

    const handleSubmit = () => {
      onUpdate(order.order_id, orderStatus, paymentStatus);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {/* Header with gradient */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">Order Details</h3>
              <p className="text-blue-100 text-sm mt-1">Review and update order status</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6 space-y-6">
              {/* Product Section with enhanced styling */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start gap-6">
                  <div className="relative group cursor-pointer" onClick={() => setImagePreview(true)}>
                    <img 
                      src={order.product_img} 
                      alt={order.product_name}
                      className="w-32 h-32 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/128?text=Product';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-300 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
                      Click to view
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900 mb-2">{order.product_name}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Order ID:</span>
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded">{order.order_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Quantity:</span>
                        <span className="font-bold text-gray-900">{order.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Price/item:</span>
                        <span className="font-bold text-gray-900">${order.price_per_item?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right bg-white rounded-xl p-4 shadow-md border-2 border-blue-200">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Amount</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${order.total_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery and Order Info Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Delivery Address Card */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{order.delivery_address}</p>
                      <p className="text-sm text-gray-700">{order.city}, {order.pincode}</p>
                      {order.landmark && (
                        <p className="text-xs text-gray-500 mt-2 italic">📍 {order.landmark}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery & Date Info Card */}
                <div className="space-y-4">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <Truck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Type</p>
                        <p className="text-sm font-semibold text-gray-900">{order.delivery_type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-lg p-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Order Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(order.order_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="bg-indigo-600 rounded-lg p-2">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <h5 className="font-bold text-lg text-gray-900">Update Order Status</h5>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium transition-all duration-200"
                    >
                      <option value="Pending">⏳ Pending</option>
                      <option value="Successfully">✅ Successfully</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Truck className="w-4 h-4 text-purple-600" />
                      Order Status
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium transition-all duration-200"
                    >
                      <option value="Pending">⏳ Pending</option>
                      <option value="Out for Delivery">🚚 Out for Delivery</option>
                      <option value="Delivered">✅ Delivered</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-600 bg-opacity-10 border-l-4 border-blue-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 font-medium leading-relaxed">
                      Updating payment to "Successfully" or status to "Out for Delivery" or "Delivered" 
                      will remove this order from the pending list.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={updating}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {imagePreview && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
            onClick={() => setImagePreview(false)}
          >
            <button 
              onClick={() => setImagePreview(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-300">
              <img 
                src={order.product_img}
                alt={order.product_name}
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800?text=Product+Image';
                }}
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 backdrop-blur-md text-white px-6 py-4 rounded-xl">
                <h4 className="font-bold text-lg mb-1">{order.product_name}</h4>
                <p className="text-sm text-gray-300">Order ID: {order.order_id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 bg-blue-200 rounded-full blur-xl mx-auto opacity-50 animate-pulse"></div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading pending orders...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-30 ">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Card with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Pending Orders Management</h1>
              <p className="text-blue-100">Orders awaiting payment confirmation and processing</p>
            </div>
            <button
              onClick={() => fetchPendingOrders()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3 text-red-800">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="relative inline-block mb-6">
              <Package className="w-24 h-24 text-gray-300 mx-auto" />
              <div className="absolute inset-0 bg-gray-200 rounded-full blur-2xl opacity-30"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Pending Orders</h3>
            <p className="text-gray-600 text-lg">All orders have been processed or paid successfully.</p>
          </div>
        )}

        {/* Orders Grid */}
        <div className="space-y-5">
          {orders.map((order) => {
            const isPending = order.status?.toLowerCase() === 'pending';
            const isPaymentPending = order.payment_status?.toLowerCase() === 'pending';
            const needsAttention = isPending && isPaymentPending;
            
            return (
            <div 
              key={order.order_id} 
              className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                needsAttention 
                  ? 'border-red-300 ring-2 ring-red-200 ring-offset-2' 
                  : 'border-transparent hover:border-blue-200'
              }`}
            >
              {needsAttention && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-white" />
                  <p className="text-white text-sm font-semibold">⚠️ Requires Immediate Attention - Payment & Order Pending</p>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Product Image */}
                  <div className="relative group flex-shrink-0">
                    <img 
                      src={order.product_img} 
                      alt={order.product_name}
                      className="w-28 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/112?text=Product';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                    {needsAttention && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                        !
                      </div>
                    )}
                  </div>
                  
                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-1">{order.product_name}</h3>
                        <p className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-3 py-1 rounded-lg">
                          ID: {order.order_id}
                        </p>
                      </div>
                      <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-4 py-2 border-2 border-blue-200">
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          ${order.total_amount?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-gray-500 font-semibold uppercase">Quantity</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{order.quantity}</p>
                      </div>

                      <div className={`rounded-lg p-3 border ${
                        isPaymentPending 
                          ? 'bg-red-50 border-red-300 ring-1 ring-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className={`w-4 h-4 ${isPaymentPending ? 'text-red-600' : 'text-yellow-600'}`} />
                          <p className={`text-xs font-semibold uppercase ${isPaymentPending ? 'text-red-600' : 'text-gray-600'}`}>
                            Payment
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${
                          isPaymentPending 
                            ? 'bg-red-200 text-red-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {order.payment_status}
                        </span>
                      </div>

                      <div className={`rounded-lg p-3 border ${
                        isPending 
                          ? 'bg-red-50 border-red-300 ring-1 ring-red-200' 
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className={`w-4 h-4 ${isPending ? 'text-red-600' : 'text-orange-600'}`} />
                          <p className={`text-xs font-semibold uppercase ${isPending ? 'text-red-600' : 'text-gray-600'}`}>
                            Status
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${
                          isPending 
                            ? 'bg-red-200 text-red-800' 
                            : 'bg-orange-200 text-orange-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {order.status}
                        </span>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <p className="text-xs text-gray-600 font-semibold uppercase">Date</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatDate(order.order_date)}</p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium">{order.delivery_address}, {order.city} - {order.pincode}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className={`flex items-center gap-2 px-5 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap self-start ${
                      needsAttention
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white animate-pulse'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                    {needsAttention ? 'Action Required' : 'View & Update'}
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>

        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default PendingOrdersManager;