import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, MapPin, Calendar, DollarSign, Truck, XCircle, Eye, X, AlertCircle } from 'lucide-react';

const PendingOrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [apiToken, setApiToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(token)
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
      const response = await fetch('/past_order/view', {
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
        // Filter orders with pending status and unsuccessful payment (case-insensitive)
        const pendingOrders = data.past_orders.filter(order => {
          const statusLower = order.status?.toLowerCase() || '';
          const paymentLower = order.payment_status?.toLowerCase() || '';
          return statusLower === 'pending' && paymentLower !== 'successfully';
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

      const response = await fetch(`/past_order/update-status/${orderId}`, {
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
      
      // Refresh the orders list after successful update
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

    const handleSubmit = () => {
      onUpdate(order.order_id, orderStatus, paymentStatus);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <img 
                src={order.product_img} 
                alt={order.product_name}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/96?text=Product';
                }}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-gray-900">{order.product_name}</h4>
                <p className="text-sm text-gray-500 mt-1">Order ID: {order.order_id}</p>
                <p className="text-sm text-gray-500">Product ID: {order.product_id}</p>
                <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                <p className="text-sm text-gray-600 mt-1">Price per item: ${order.price_per_item?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${order.total_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Address</p>
                    <p className="text-sm font-medium text-gray-900">{order.delivery_address}</p>
                    <p className="text-sm text-gray-600">{order.city}, {order.pincode}</p>
                    {order.landmark && <p className="text-xs text-gray-500">Landmark: {order.landmark}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Type</p>
                    <p className="text-sm font-medium text-gray-900">{order.delivery_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.order_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-4">Update Status</h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Successfully">Successfully</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      Note: Updating payment to "Successfully" or status to "Out for Delivery" or "Delivered" 
                      will remove this order from the pending list.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={updating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pending orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Orders Management</h1>
              <p className="text-gray-600 mt-1">Orders awaiting payment confirmation and processing</p>
            </div>
            <button
              onClick={() => fetchPendingOrders()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Orders</h3>
            <p className="text-gray-600">All orders have been processed or paid successfully.</p>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img 
                    src={order.product_img} 
                    alt={order.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=Product';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{order.product_name}</h3>
                        <p className="text-sm text-gray-500">Order ID: {order.order_id}</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">${order.total_amount?.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-sm font-medium text-gray-900">{order.quantity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {order.payment_status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Order Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(order.order_date)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{order.delivery_address}, {order.city} - {order.pincode}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View & Update
                  </button>
                </div>
              </div>
            </div>
          ))}
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