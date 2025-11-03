import { useContext, useState, useEffect } from "react";
import { ClientContext } from "../layouts/MainLayouts.jsx";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { securityStatus } = useContext(ClientContext);

  const BASE_URL = "https://ellectra-beta.vercel.app/ellectra/v1";

  // 🧠 Check token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setLogin(true);
    else setLogin(false);
  }, []);

  // 🛒 Fetch Cart Count (continuous check)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchCart = async () => {
      try {
        const res = await fetch(`${BASE_URL}/cart/view`, {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();

        if (data?.cart) {
          setCartCount(data.cart.length);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.error("Cart fetch error:", err);
        setCartCount(0);
      }
    };

    // Initial call
    fetchCart();

    // 🔁 Refresh every 15 seconds
    const interval = setInterval(fetchCart, 30000);
    return () => clearInterval(interval);
  }, [login]);

  // 🔐 Google login handler
  const handleGoogleLogin = async () => {
    try {
      setLogin(true);
      window.location.href = `${BASE_URL}/users/users_google`;
    } catch (error) {
      console.error("Error starting Google login:", error);
      setLogin(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 lg:py-5 bg-white/10 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dosahgtni/image/upload/v1762153393/Ellectra_w01wap.png"
            alt="logo"
            className="w-18 h-10"
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link to="/" className="hover:text-gray-500 transition-colors py-2 text-[#22BDF5] font-semibold">
            Home
          </Link>
          <Link to="/Shop" className="hover:text-gray-500 transition-colors py-2 text-[#22BDF5] font-semibold">
            Shop
          </Link>

          {/* 🛒 Cart with Notification Badge */}
          <Link
            to="/Cart"
            className="relative hover:text-gray-500 transition-colors py-2 text-[#22BDF5] font-semibold"
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {securityStatus === 1 && (
            <button
              onClick={handleGoogleLogin}
              className="font-semibold flex items-center gap-2 px-4 py-1 border-2 border-grey-100 rounded-full text-white hover:text-gray-600 transition-colors text-base sm:text-lg"
            >
              <img
                src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761985513/icons8-google-48_diheja.png"
                alt="google"
                className="w-5 h-5"
              />
              ACCESS KEY
            </button>
          )}

          {securityStatus === 0 && (
            <Link to="/Profile">
              <img
                src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761989157/icons8-profile-48_ykm3dq.png"
                alt="profile"
                className="w-8 h-8"
              />
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center py-3 gap-3">
          <button
            className="p-2 text-blue-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full shadow-lg z-50 bg-black/20 backdrop-blur-md">
          <div className="relative z-10 px-4 py-4 space-y-4">
            <ul className="space-y-4 text-base font-bold text-[#22BDF5]">
              <li>
                <Link
                  to="/"
                  className="block hover:text-gray-500 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/Shop"
                  className="block hover:text-gray-500 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Shop
                </Link>
              </li>

              {/* Cart with Badge */}
              <li>
                <Link
            to="/Cart"
            className="relative hover:text-gray-500 transition-colors py-2 text-[#22BDF5] font-semibold"
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
              </li>

              {securityStatus === 1 && (
                <li>
                  <button
                    onClick={handleGoogleLogin}
                    className="font-semibold flex items-center gap-2 mt-4 px-4 py-1 border-2 border-grey-100 rounded-full text-white hover:text-gray-600 transition-colors text-base sm:text-lg"
                  >
                    <img
                      src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761985513/icons8-google-48_diheja.png"
                      alt="google"
                      className="w-5 h-5"
                    />
                    Login
                  </button>
                </li>
              )}

              {securityStatus === 0 && (
                <li>
                  <Link
                    to="/Profile"
                    className="flex items-center gap-2 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <img
                      src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761989157/icons8-profile-48_ykm3dq.png"
                      alt="profile"
                      className="w-7 h-7"
                    />
                    Profile
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
