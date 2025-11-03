import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CreditCard, Truck, RefreshCw, Edit2, X, Check, ChevronRight } from 'lucide-react';

export default function OrderTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

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

      const response = await fetch('https://ellectra-beta.vercel.app/ellectra/v1/past_order/view', {
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

  const handleEdit = (order) => {
    setEditingOrder(order.order_id);
    setEditForm({
      payment_status: order.payment_status,
      delivery_address: order.delivery_address,
      city: order.city,
      pincode: order.pincode,
      landmark: order.landmark || '',
      delivery_type: order.delivery_type
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditForm({});
  };

  const handleUpdateOrder = async (orderId) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://ellectra-beta.vercel.app/ellectra/v1/past_order/update/${orderId}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchOrders();
      setEditingOrder(null);
      setEditForm({});
    } catch (err) {
      alert('Error updating order: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base sm:text-lg font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 max-w-md w-full border border-gray-200">
          <div className="text-center">
            <div className="bg-red-50 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto font-medium text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 lg:p-16 text-center border border-gray-200">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">No Orders Found</h2>
            <p className="text-sm sm:text-base text-gray-600">You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Order ID</p>
                      <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">{order.order_id}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className={`px-3 py-1.5 sm:px-4 rounded-md text-xs sm:text-sm font-medium border whitespace-nowrap ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                      {order.payment_status.toLowerCase() === 'pending' && editingOrder !== order.order_id && (
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                          title="Edit order"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {editingOrder === order.order_id ? (
                    /* Edit Form */
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Edit Order Details</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                          <select
                            value={editForm.payment_status}
                            onChange={(e) => setEditForm({...editForm, payment_status: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
                          <input
                            type="text"
                            value={editForm.delivery_type}
                            onChange={(e) => setEditForm({...editForm, delivery_type: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                          <input
                            type="text"
                            value={editForm.delivery_address}
                            onChange={(e) => setEditForm({...editForm, delivery_address: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Pincode</label>
                          <input
                            type="text"
                            value={editForm.pincode}
                            onChange={(e) => setEditForm({...editForm, pincode: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                          <input
                            type="text"
                            value={editForm.landmark}
                            onChange={(e) => setEditForm({...editForm, landmark: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter a landmark"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          onClick={() => handleUpdateOrder(order.order_id)}
                          disabled={updating}
                          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base"
                        >
                          <Check className="w-4 h-4" />
                          {updating ? 'Updating...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 sm:px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Order Details View */
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                      {/* Product Image */}
                      <div className="flex-shrink-0 mx-auto lg:mx-0">
                        <img
                          src={order.product_img}
                          alt={order.product_name}
                          className="w-full sm:w-64 lg:w-56 xl:w-64 h-48 sm:h-56 lg:h-48 xl:h-56 object-cover rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Order Details */}
                      <div className="flex-grow space-y-4 sm:space-y-5 min-w-0">
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 break-words">{order.product_name}</h3>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-600">
                            <span className="text-xs sm:text-sm">Quantity: <span className="font-medium text-gray-900">{order.quantity}</span></span>
                            <span className="text-xs sm:text-sm">₹{order.price_per_item.toFixed(2)} per item</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-gray-500">Order Date</p>
                              <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{formatDate(order.order_date)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-gray-500">Delivery Type</p>
                              <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">{order.delivery_type}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 sm:col-span-2 xl:col-span-1">
                            <div className="flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-gray-500">Delivery Address</p>
                              <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{order.delivery_address}</p>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{order.city}, {order.pincode}</p>
                              {order.landmark && <p className="text-xs sm:text-sm text-gray-600 break-words">Landmark: {order.landmark}</p>}
                            </div>
                          </div>

                          <div className="flex items-start gap-3 sm:col-span-2 xl:col-span-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
                              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">₹{order.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}