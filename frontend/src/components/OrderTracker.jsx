import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CreditCard, Truck } from 'lucide-react';

export default function OrderTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
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
        throw new Error('Failed to fetch orders');
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
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-center">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Orders</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Your Orders</h1>
          <p className="text-gray-600">View and track all your past orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Package className="w-20 h-20 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Orders Found</h2>
            <p className="text-gray-500">You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm opacity-90">Order ID</p>
                      <p className="text-xl font-bold">{order.order_id}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={order.product_img}
                        alt={order.product_name}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>

                    <div className="flex-grow space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{order.product_name}</h3>
                        <div className="flex items-center gap-4 text-gray-600">
                          <span>Quantity: <span className="font-semibold">{order.quantity}</span></span>
                          <span>₹{order.price_per_item.toFixed(2)} per item</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-indigo-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="font-semibold text-gray-800">{formatDate(order.order_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Truck className="w-5 h-5 text-indigo-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Delivery Type</p>
                            <p className="font-semibold text-gray-800">{order.delivery_type}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-indigo-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Delivery Address</p>
                            <p className="font-semibold text-gray-800">{order.delivery_address}</p>
                            <p className="text-sm text-gray-600">{order.city}, {order.pincode}</p>
                            {order.landmark && <p className="text-sm text-gray-600">Landmark: {order.landmark}</p>}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-indigo-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-indigo-600">₹{order.total_amount.toFixed(2)}</p>
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