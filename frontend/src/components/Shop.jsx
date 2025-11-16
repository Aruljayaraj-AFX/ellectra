import { useState, useEffect } from 'react';
import { ArrowRight, Search, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [addingToCart, setAddingToCart] = useState(null);
  const phoneNumber = "916381733447"; 

  const sendToWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://ellectra-beta.vercel.app/ellectra/v1/products/cat_info?pagination=${page}`,
          {
            method: 'GET',
            headers: { accept: 'application/json' },
          }
        );
        const data = await res.json();

        if (data && data.data) {
          setCategories(data.data);
          const totalPagesCount = Math.ceil(
            (data.total_records || 1) / (data.page_size || 10)
          );
          setTotalPages(totalPagesCount);
        } else {
          setCategories([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [page]);

  useEffect(()=>{
    const fetchsearchdata = async()=>{
      try{
        setLoading(true);
        const res = await fetch(
          `https://ellectra-beta.vercel.app/ellectra/v1/products/search?query=${searchQuery}`,
          {
            method: 'GET',
            headers: { accept: 'application/json' },
          }
        );
        const productData = await res.json();
        if (productData && productData.data) {
          setProducts(productData.data);
          console.log(products);
          setLoading(false);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } 
    };
    fetchsearchdata();
  },[searchQuery]);

  const handleAddToCart = async (productId) => {
    try {
      setCartMsg("");
      setAddingToCart(productId);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setCartMsg("Please log in to add items to your cart.");
        setAddingToCart(null);
        return;
      }

      const res = await fetch("https://ellectra-beta.vercel.app/ellectra/v1/cart/add", {
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
        throw new Error(data.message || "Failed to add to cart");
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="flex flex-col lg:flex-row md:flex-row lg:justify-between md:justify-between">
        
        <div className="flex lg:pt-30 md:pt-27 pt-20 px-4 md:px-20 lg:px-40">
          <h1 className="lg:text-4xl md:text-4xl text-2xl font-semibold">
            Categories
          </h1>
        </div>

        <div className="flex pt-5 lg:pt-27 md:pt-25 -ml-5 md:px-20 lg:px-40">
          <div className="max-w-xs mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 text-lg rounded-full border-2 border-gray-300 focus:outline-none focus:border-[#22BDF5] transition-colors shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`flex flex-col sm:flex-row items-center px-4 md:px-20 lg:px-40 gap-1 sm:gap-2 mb-6 sm:mb-8 transition-all duration-1000 ease-out delay-300`}
      >
        <input
          type="text"
          placeholder="Type New Component ..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border border-gray-300 text-black rounded-md p-2 w-64 focus:outline-none focus:ring-2 focus:ring-bg-gray-300"
        />
        <button
          onClick={sendToWhatsApp}
          className="bg-gray-300 hover:bg-green-300 text-black font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-300"
        >
          Request for Component
        </button>
      </div>

      <div className="px-4 md:px-20 lg:px-40 pb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-600 text-xl font-medium">
            Loading...
          </div>
        ) : categories.length > 0 && searchQuery === '' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {categories.map((cat) => (
              <div
                key={cat.category_id}
                className="flex flex-col items-center w-full h-[340px] md:h-[400px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="relative w-[95%] h-[75%] mt-2 rounded-xl overflow-hidden">
                  <img
                    src={cat.category_img}
                    alt={cat.category_name}
                    className="object-cover w-full h-full rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between w-full mt-3 px-4">
                  <div className="flex flex-col">
                    <h1 className="font-bold text-lg md:text-2xl lg:text-2xl truncate">
                      {cat.category_name}
                    </h1>
                  </div>

                  <Link
                    to={`product/?${cat.category_id}`}
                    className="flex border-gray-400 border-2 rounded-full hover:bg-[#22BDF5] hover:border-[#22BDF5] transition-all"
                  >
                    <ArrowRight
                      color="black"
                      className="rotate-315 p-1 w-8 h-8 md:w-12 md:h-12 lg:w-12 lg:h-12"
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery != '' &&(
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {products.map((product)=>(
              <div
                key={product.product_id}
                className="flex flex-col items-center w-full h-[420px] md:h-[460px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
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
                      disabled={addingToCart === product.product_id}
                      className={`rounded-full px-4 py-2 transition flex items-center gap-2 ${
                        addingToCart === product.product_id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#22BDF5] hover:bg-[#19aee6] text-white"
                      }`}
                    >
                      {addingToCart === product.product_id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Add to cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 pb-10">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg border-2 ${
            page === 1
              ? 'border-gray-300 text-gray-400'
              : 'border-[#22BDF5] text-[#22BDF5] hover:bg-[#22BDF5] hover:text-white'
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
              ? 'border-gray-300 text-gray-400'
              : 'border-[#22BDF5] text-[#22BDF5] hover:bg-[#22BDF5] hover:text-white'
          } transition`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
