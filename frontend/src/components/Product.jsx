import { useState, useEffect } from "react";
import { ArrowRight, Search, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Product() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartMsg, setCartMsg] = useState(""); // ✅ feedback message

  const location = useLocation();
  const categoryId = location.search.replace("?", "").trim();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        if (!categoryId) {
          console.warn("No category ID found in URL.");
          setProducts([]);
          return;
        }

        const res = await fetch(
          `http://localhost:8000/ellectra/v1/products/pro_info?pagination=${page}&catgories_id=${categoryId}`,
          {
            method: "GET",
            headers: { accept: "application/json" },
          }
        );

        const data = await res.json();

        if (data && data.data) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }

        const pageRes = await fetch(
          `http://localhost:8000/ellectra/v1/products/pag_pro_info`
        );
        const pageData = await pageRes.json();
        setTotalPages(pageData.total_pages || 1);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, categoryId]);

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // 🛒 ADD TO CART FUNCTION
  const handleAddToCart = async (productId) => {
    try {
      setCartMsg(""); // reset message
      const token = localStorage.getItem("token");
      if (!token) {
        setCartMsg("❌ Please log in to add items to your cart.");
        return;
      }

      const res = await fetch("http://localhost:8000/ellectra/v1/cart/add", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pro_id: productId,
          quantity: 1, // ✅ default quantity 1
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add to cart");
      }

      setCartMsg("✅ Added to cart successfully!");
      setTimeout(() => setCartMsg(""), 3000);
    } catch (err) {
      console.error("Add to cart error:", err);
      setCartMsg(`❌ ${err.message || "Failed to add to cart"}`);
      setTimeout(() => setCartMsg(""), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row md:flex-row lg:justify-between md:justify-between">
        <div className="flex lg:pt-30 md:pt-27 pt-20 px-4 md:px-20 lg:px-40">
          <h1 className="lg:text-4xl md:text-4xl text-2xl font-semibold">
            Products
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex pt-5 lg:pt-27 md:pt-25 -ml-5 md:px-20 lg:px-40">
          <div className="max-w-xs mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 text-lg rounded-full border-2 border-gray-300 focus:outline-none focus:border-[#22BDF5] transition-colors shadow-lg"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                Found {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🟢 Cart feedback message */}
      {cartMsg && (
        <div
          className={`text-center py-3 font-semibold ${
            cartMsg.startsWith("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {cartMsg}
        </div>
      )}

      {/* Product List */}
      <div className="px-4 md:px-20 lg:px-40 pb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-600 text-xl font-medium">
            Loading...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                className="flex flex-col items-center w-full h-[420px] md:h-[460px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Product Image */}
                <div className="w-full h-[65%] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.product_img ? (
                    <img
                      src={product.product_img}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = "/placeholder.png")}
                    />
                  ) : (
                    <span className="text-gray-500 italic">No Image</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-grow px-4 w-full justify-between py-3">
                  <h1 className="font-semibold text-lg md:text-2xl truncate">
                    {product.product_name}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Category: {product.category_id}
                  </p>
                  <p className="text-gray-600 text-sm my-2 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="mt-auto flex justify-between items-center">
                    <h1 className="font-bold text-green-600 text-md md:text-lg">
                      ₹{product.price}
                    </h1>
                    <button
                      onClick={() => handleAddToCart(product.product_id)}
                      className="bg-[#22BDF5] text-white rounded-full px-4 py-2 hover:bg-[#19aee6] transition flex items-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-700">
              No products found
            </h2>
            <p className="text-gray-500 mt-2">
              Try searching with different keywords
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex justify-center items-center gap-4 pb-5">
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
