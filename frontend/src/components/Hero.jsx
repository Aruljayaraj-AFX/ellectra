import { useContext,useState, useEffect } from 'react';
import { ClientContext } from "../layouts/MainLayouts.jsx";
import {Link} from 'react-router-dom';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const { securityStatus } = useContext(ClientContext);
  const [login, setLogin] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log(securityStatus);
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  const handleGoogleLogin = async () => {
  try {
    setLogin(true);
    window.location.href = "https://ellectra-beta.vercel.app/ellectra/v1/users/users_google";
  } catch (error) {
    console.error("Error starting Google login:", error);
    setLogin(false);
  }
};

  return (
    <section className="min-h-screen text-center flex items-center px-4 bg-[#12161D] sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* PCB Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pcb-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#22BDF5" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#pcb-grid)"/>
          
          {/* Circuit traces */}
          <g className="animate-pulse" style={{animationDuration: '3s'}}>
            <line x1="10%" y1="20%" x2="40%" y2="20%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <circle cx="10%" cy="20%" r="4" fill="#22BDF5" filter="url(#glow)"/>
            <circle cx="40%" cy="20%" r="4" fill="#22BDF5" filter="url(#glow)"/>
          </g>
          
          <g className="animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}>
            <line x1="60%" y1="30%" x2="90%" y2="30%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <line x1="90%" y1="30%" x2="90%" y2="60%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <circle cx="60%" cy="30%" r="4" fill="#22BDF5" filter="url(#glow)"/>
            <circle cx="90%" cy="60%" r="4" fill="#22BDF5" filter="url(#glow)"/>
          </g>
          
          <g className="animate-pulse" style={{animationDuration: '3.5s', animationDelay: '1s'}}>
            <line x1="15%" y1="70%" x2="45%" y2="70%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <line x1="45%" y1="70%" x2="45%" y2="90%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <circle cx="15%" cy="70%" r="4" fill="#22BDF5" filter="url(#glow)"/>
            <circle cx="45%" cy="90%" r="4" fill="#22BDF5" filter="url(#glow)"/>
          </g>
          
          <g className="animate-pulse" style={{animationDuration: '4.5s', animationDelay: '0.3s'}}>
            <line x1="70%" y1="15%" x2="70%" y2="45%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <circle cx="70%" cy="15%" r="4" fill="#22BDF5" filter="url(#glow)"/>
            <circle cx="70%" cy="45%" r="4" fill="#22BDF5" filter="url(#glow)"/>
          </g>
          
          <g className="animate-pulse" style={{animationDuration: '3.8s', animationDelay: '1.5s'}}>
            <line x1="25%" y1="50%" x2="55%" y2="50%" stroke="#22BDF5" strokeWidth="2" opacity="0.6"/>
            <circle cx="25%" cy="50%" r="4" fill="#22BDF5" filter="url(#glow)"/>
            <circle cx="55%" cy="50%" r="4" fill="#22BDF5" filter="url(#glow)"/>
          </g>
          
          {/* Component shapes */}
          <g className="animate-pulse" style={{animationDuration: '5s'}}>
            <rect x="35%" y="60%" width="30" height="20" fill="none" stroke="#22BDF5" strokeWidth="1.5" opacity="0.5"/>
            <line x1="36%" y1="65%" x2="39%" y2="65%" stroke="#22BDF5" strokeWidth="1" opacity="0.5"/>
            <line x1="36%" y1="70%" x2="39%" y2="70%" stroke="#22BDF5" strokeWidth="1" opacity="0.5"/>
            <line x1="36%" y1="75%" x2="39%" y2="75%" stroke="#22BDF5" strokeWidth="1" opacity="0.5"/>
          </g>
          
          <g className="animate-pulse" style={{animationDuration: '4.2s', animationDelay: '0.8s'}}>
            <circle cx="80%" cy="75%" r="12" fill="none" stroke="#22BDF5" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="80%" cy="75%" r="6" fill="none" stroke="#22BDF5" strokeWidth="1" opacity="0.5"/>
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto">
        <div 
          className="relative inline-block cursor-none"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setShowCursor(true)}
          onMouseLeave={() => setShowCursor(false)}
        >
          <h1 
            className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight max-w-5xl mx-auto mb-4 sm:mb-6 text-white transition-all duration-1000 ease-out delay-100 ${
              isLoaded 
                ? 'transform translate-y-0 opacity-100 scale-100' 
                : 'transform translate-y-8 opacity-0 scale-1100'
            }`}
          >
            Innovate with the Best Components
          </h1>
          
          {showCursor && (
            <div
              className="absolute pointer-events-none z-50 transition-transform duration-75"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-8 h-8 rounded-full bg-[#22BDF5] mix-blend-difference animate-pulse" />
            </div>
            
          )}
        </div>
        
        <p 
          className={`text-sm sm:text-base md:text-lg text-gray-400 font-semibold max-w-xs sm:max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0 transition-all duration-1000 ease-out delay-200 ${
            isLoaded 
              ? 'transform translate-y-0 opacity-100 scale-100' 
              : 'transform translate-y-6 opacity-0 scale-1050'
          }`}
        >
          Your one-stop shop for quality electronic parts and modules.
        </p>
        
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8 transition-all duration-1000 ease-out delay-300 ${
            isLoaded 
              ? 'transform translate-y-0 opacity-100 scale-100' 
              : 'transform translate-y-8 opacity-0 scale-105'
          }`}
        >
          <Link to="/Shop" className="px-6 lg:px-6 py-3 bg-[#22BDF5] font-bold text-black border-2 rounded-full text-base sm:text-lg shadow-[4px_4px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_black] transition-all duration-100">
            Shop Now
          </Link>
          {securityStatus === 1 &&<button 
            onClick={handleGoogleLogin}
            className="font-semibold flex items-center gap-2 px-7 py-3 border-2 border-grey-100 rounded-full  text-white hover:text-gray-600 transition-colors text-base sm:text-lg"
          >
            <img src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761985513/icons8-google-48_diheja.png" alt="google" className="w-5 h-5"/>Login
          </button>
          }
        </div>
      </div>

      
    </section>
  );
}