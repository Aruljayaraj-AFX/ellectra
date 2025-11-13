import React, { useState, useEffect, useCallback, memo } from "react";
import { ArrowRight, Search, ShoppingCart, Loader2, AlertCircle, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ShopButton({ external = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (external) {
      window.location.href = "https://www.ellectra.in/Shop";
    } else {
      navigate("/Shop");
    }
  };

  return (
    <button
  type="button"
  onClick={handleClick}
  aria-label="Go to Shop"
  className="flex items-center gap-2 px-6 py-3 rounded-full 
             bg-gradient-to-r from-[#22BDF5] to-[#1a9dd4] 
             text-white font-medium shadow-md 
             hover:shadow-lg hover:scale-105 
             transition-all duration-300"
>
  <p className="text-sm md:text-base tracking-wide">Categories</p>
</button>
  );
}

// ProductCard Component
const ProductCard = memo(({ product, viewMode, onAddToCart, addingToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (viewMode === "list") {
    return (
      <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto flex-shrink-0">
          {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
          <img
            src={product.product_img || "/placeholder.png"}
            alt={product.product_name || "Product image"}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
            className={`object-cover w-full h-full transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between gap-3">
          <div className="flex-1">
            <h2 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-800 mb-1 sm:mb-2">
              {product.product_name}
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-2">
              Category: {product.category_id ?? "—"}
            </p>
            {product.description && <p className="text-gray-600 text-xs sm:text-sm line-clamp-3">{product.description}</p>}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
              ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
            </p>

            <button
              onClick={() => onAddToCart(product.product_id)}
              disabled={addingToCart === product.product_id}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
                addingToCart === product.product_id
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#22BDF5] hover:bg-[#19aee6] text-white hover:shadow-lg hover:scale-105"
              }`}
              aria-label={`Add ${product.product_name} to cart`}
            >
              {addingToCart === product.product_id ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="font-medium text-sm sm:text-base">Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">Add to cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GRID / CARD VIEW
  return (
    <div className="flex flex-col w-full h-[420px] md:h-[460px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative w-full h-[65%] bg-gray-100 overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
        <img
          src={product.product_img || "/placeholder.png"}
          alt={product.product_name || "Product image"}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
          className={`object-cover w-full h-full transition-all duration-500 hover:scale-110 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div className="flex flex-col flex-grow px-4 w-full justify-between py-3">
        <h1 className="font-semibold text-lg md:text-xl truncate">{product.product_name}</h1>
        <p className="text-gray-400 text-xs sm:text-sm">Category: {product.category_id ?? "—"}</p>

        {product.description && <p className="text-gray-600 text-xs sm:text-sm my-2 line-clamp-2">{product.description}</p>}

        <div className="mt-auto flex justify-between items-center">
          <h1 className="font-bold text-green-600 text-md md:text-lg">₹{Number(product.price ?? 0).toLocaleString("en-IN")}</h1>

          <button
            onClick={() => onAddToCart(product.product_id)}
            disabled={addingToCart === product.product_id}
            className={`rounded-full px-4 py-2 transition-all duration-300 flex items-center gap-2 ${
              addingToCart === product.product_id
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#22BDF5] hover:bg-[#19aee6] text-white hover:shadow-lg"
            }`}
            aria-label={`Add ${product.product_name} to cart`}
          >
            {addingToCart === product.product_id ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span className="text-sm">Add to cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// SearchBar Component
const SearchBar = memo(({ value, onChange, resultsCount }) => (
  <div className="w-full">
    <div className="relative">
      <Search className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
      <input
        type="text"
        placeholder="Search for products..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#22BDF5] focus:ring-4 focus:ring-[#22BDF5]/20 transition-all shadow-sm hover:shadow-md bg-white"
        aria-label="Search products"
      />
    </div>

    {value && (
      <div className="mt-2 sm:mt-3 text-center">
        <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[#22BDF5]/10 text-[#22BDF5] rounded-full text-xs sm:text-sm font-medium">
          {resultsCount} {resultsCount === 1 ? "result" : "results"} found for "{value}"
        </span>
      </div>
    )}
  </div>
));

// WhatsApp Request Modal
const WhatsAppModal = memo(({ isOpen, onClose, phoneNumber }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, "_blank");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 transform transition-all animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Request Component</h3>
              <p className="text-xs sm:text-sm text-gray-500">Send us a WhatsApp message</p>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the component you need..."
          className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl text-sm sm:text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all resize-none"
          rows="4"
        />

        <div className="flex gap-2 sm:gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm sm:text-base hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm sm:text-base hover:shadow-lg transition-all font-medium hover:scale-105"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
});

// Pagination Component
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
        currentPage === 1
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-[#22BDF5] border-2 border-[#22BDF5] hover:bg-[#22BDF5] hover:text-white shadow-sm hover:shadow-md"
      }`}
      aria-label="Previous page"
    >
      <span className="hidden sm:inline">Previous</span>
      <span className="sm:hidden">Prev</span>
    </button>

    <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-4">
      {[...Array(Math.min(totalPages <= 5 ? totalPages : 3, totalPages))].map((_, idx) => {
        let pageNum;
        if (totalPages <= 3) {
          pageNum = idx + 1;
        } else if (currentPage <= 2) {
          pageNum = idx + 1;
        } else if (currentPage >= totalPages - 1) {
          pageNum = totalPages - 2 + idx;
        } else {
          pageNum = currentPage - 1 + idx;
        }

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
              currentPage === pageNum
                ? "bg-gradient-to-r from-[#22BDF5] to-[#1a9dd4] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#22BDF5] hover:text-[#22BDF5]"
            }`}
            aria-label={`Go to page ${pageNum}`}
            aria-current={currentPage === pageNum ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}
    </div>

    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
        currentPage === totalPages
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-[#22BDF5] border-2 border-[#22BDF5] hover:bg-[#22BDF5] hover:text-white shadow-sm hover:shadow-md"
      }`}
      aria-label="Next page"
    >
      Next
    </button>
  </div>
));

// Main Component
export default function ProductList() {
  // Base endpoints (keep consistent)
  const BASE_API = "http://ellectra-beta.vercel.app/ellectra/v1";
  const BASE_PRODUCTS = `${BASE_API}/products`;
  const PHONE_NUMBER = "916381733447";

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // Missing states for cart interactions
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMsg, setCartMsg] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch total pages
  useEffect(() => {
    const fetchTotalPages = async () => {
      try {
        const res = await fetch(`${BASE_PRODUCTS}/total-pages`);
        const data = await res.json();
        if (data && data.total_pages) setTotalPages(Number(data.total_pages));
      } catch (err) {
        console.error("Error fetching total pages:", err);
      }
    };
    fetchTotalPages();
  }, [BASE_PRODUCTS]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        let url =
          debouncedSearch.trim() !== ""
            ? `${BASE_PRODUCTS}/search?query=${encodeURIComponent(debouncedSearch)}`
            : `${BASE_PRODUCTS}/view?page=${page}`;

        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Failed to fetch products (${res.status})`);
        }
        const data = await res.json();

        if (data && data.data) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, debouncedSearch, BASE_PRODUCTS]);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  const onAddToCart = async (productId) => {
    try {
      setCartMsg("");
      setAddingToCart(productId);

      const token = localStorage.getItem("token");
      if (!token) {
        setCartMsg("Please log in to add items to your cart.");
        setAddingToCart(null);
        return;
      }

      const res = await fetch(`${BASE_API}/cart/add`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pro_id: productId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to add to cart");
      }

      setCartMsg("✅ Added to cart successfully!");
      setTimeout(() => setCartMsg(""), 3000);
    } catch (err) {
      console.error("Add to cart error:", err);
      setCartMsg(`${err.message || "Failed to add to cart"}`);
      setTimeout(() => setCartMsg(""), 4000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen mt-12 sm:mt-16 md:mt-20 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#22BDF5] to-[#1a9dd4] bg-clip-text text-transparent">
                  Products
                </h1>
                <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">Discover our latest collection</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base hover:shadow-lg transition-all hover:scale-105 font-medium"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Request</span>
                </button>

                {/* view mode toggles (optional) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-pressed={viewMode === "grid"}
                    className={`p-2 rounded-md ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                    title="Grid view"
                  >
                    <ArrowRight className="w-4 h-4 transform rotate-90" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    className={`p-2 rounded-md ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                    title="List view"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar + Shop button */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex items-center gap-4">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} resultsCount={products.length} />
        </div>

        <div>
          {/* Default SPA navigation; pass external={true} to force full-page load */}
          <ShopButton external={false} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12">
        {cartMsg && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 sm:gap-3 text-green-700 text-sm sm:text-base">
            <span>{cartMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 sm:gap-3 text-red-700 text-sm sm:text-base">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#22BDF5] animate-spin mb-3 sm:mb-4" />
            <p className="text-gray-600 text-base sm:text-lg">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
                : "flex flex-col gap-3 sm:gap-4"
            }
          >
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} viewMode={viewMode} onAddToCart={onAddToCart} addingToCart={addingToCart} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">No products found</h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">Try searching with different keywords</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!debouncedSearch && products.length > 0 && totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} phoneNumber={PHONE_NUMBER} />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}