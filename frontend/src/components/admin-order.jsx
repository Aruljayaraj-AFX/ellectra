import { useEffect, useState } from "react";
import arrow from "../assets/innerarrow.png";

export default function Order() {
  const BASE_URL = "http://localhost:8001/ellectra/v1";
  const token = localStorage.getItem("token");
  const limit = 10;
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [del , setdel] = useState("Pending");
  const [pay,setpay] = useState("Pending");

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/past_order/view?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Fetched Orders:", data.past_orders); 

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.past_orders || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching orders:", error.message);
    }
  };

  const updateOrderStatus = async(order_id)=> {
    if (!pay || !del) {
    alert("Please select both payment and delivery status");}
  try {
    const response = await fetch(
      `${BASE_URL}/past_order/update-status/${order_id}`,
      {
        method: "PATCH",
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        body: JSON.stringify({
          payment_status: pay,
          status: del,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to update order status");
    const data = await response.json();
    console.log("Order status updated:", data);
    return data;
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="pt-20 px-8">
      {!selectedOrder && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div
              key={index}
              onClick={() => handleOrderClick(order)}
              className="cursor-pointer flex w-[90%] border border-gray-300 shadow mx-auto rounded-full px-5 items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="p-5">
                <p className="text-2xl text-gray-700 font-semibold">
                  Order #{order.order_id}
                </p>
                <p className="text-gray-400">
                  {order.order_date
                    ? order.order_date.split("T")[0]
                    : "N/A"}{" "}
                  | {order.status}
                </p>
                <p className="text-gray-500 text-sm">
                  Total: ₹{order.total_amount} ({order.total_items} items)
                </p>
              </div>
              <img src={arrow} alt="arrow" className="w-6 h-6" />
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="relative bg-gray-100 p-6 mb-10 rounded-xl w-[90%] mx-auto shadow">
          <img
            src={arrow}
            onClick={handleBack}
            alt="back"
            className="rotate-180 absolute left-4 top-4 w-6 h-6 cursor-pointer hover:opacity-70"
          />

          <div className="text-center mt-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Order #{selectedOrder.order_id}
            </h2>
            <p className="text-gray-500 mt-1">
              {selectedOrder.order_date?.split("T")[0]} |{" "}
              {selectedOrder.status}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedOrder.items.map((item, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition"
              >
                <img
                  src={item.product_img}
                  alt={item.product_name}
                  className="w-full h-40 object-contain rounded"
                />
                <h3 className="text-lg font-medium mt-2 text-gray-800">
                  {item.product_name}
                </h3>
                <p className="text-gray-600">
                  Qty: {item.quantity} × ₹{item.price_per_item}
                </p>
                <p className="font-semibold text-[#22BDF5]">
                  Total: ₹{item.item_total}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Order Summary
            </h3>
            <p>
              <strong>Total Items:</strong> {selectedOrder.total_items}
            </p>
            <p>
              <strong>Total Amount:</strong> ₹{selectedOrder.total_amount}
            </p>
            <p>
              <strong>Payment Status:</strong> {selectedOrder.payment_status}
            </p>
            <p>
              <strong>Delivery Type:</strong> {selectedOrder.delivery_type}
            </p>
          </div>

          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delivery Address
            </h3>
            <p><strong>username:</strong>{selectedOrder.user_name}</p>
            <p><strong>address:</strong>{selectedOrder.delivery_address}</p>
            <p>
              {selectedOrder.city} - {selectedOrder.pincode}
            </p>
            <p>
              <strong>Landmark:</strong> {selectedOrder.landmark || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {selectedOrder.user_phoneno}
            </p>
          </div>
       <div className="flex items-center justify-center gap-4 m-5">
      <div className="flex items-center gap-2">
        <select
          value={pay} 
          onChange={(e) => setpay(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-gray-700"
        >
          <option value="" disabled>
            Select Payment Status
          </option>
          <option value="Successfully Delivered">Successfully</option>
        </select>
      </div>
    
      <div className="flex items-center gap-2">
        <select
          value={del} 
          onChange={(e) => setdel(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-gray-700"
        >
          <option value="" disabled>
            Select Delivery Status
          </option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Successfully Delivered</option>
        </select>
      </div>
    
      <button
        onClick={() => updateOrderStatus(selectedOrder.order_id)}
        className="px-4 py-2 bg-yellow-400 text-white font-semibold rounded-lg hover:bg-yellow-500 transition"
      >
        Submit
      </button>
    </div>
 </div>
      )}

      {!selectedOrder && (
        <div className="flex justify-center items-center gap-4 pb-10 mt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg border-2 ${
              page === 1
                ? "border-gray-300 text-gray-400"
                : "border-[#22BDF5] text-[#22BDF5] hover:bg-[#22BDF5] hover:text-white"
            } transition`}
          >
            Prev
          </button>

          <span className="px-3 py-2 text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg border-2 ${
              page === totalPages
                ? "border-gray-300 text-gray-400"
                : "border-[#22BDF5] text-[#22BDF5] hover:bg-[#22BDF5] hover:text-white"
            } transition`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
