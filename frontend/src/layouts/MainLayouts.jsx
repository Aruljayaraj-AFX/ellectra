import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, createContext } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const ClientContext = createContext(null);

export default function MainLayout() {
  const navigate = useNavigate();
  const [securityStatus, setSecurityStatus] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        let activeToken;
        const params = new URLSearchParams(window.location.search);
        const Token = params.get("token");

        if (Token) {
          localStorage.setItem("token", Token);
          activeToken = Token; 
        } else {
          activeToken = localStorage.getItem("token");
        }

        if (!activeToken) {
          console.log("No token found");
          if (isMounted) setSecurityStatus(1);
          return;
        }

        const res = await fetch("https://ellectra-beta.vercel.app/ellectra/v1/users/security_check/", {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (!res.ok) {
          console.warn("Token invalid or expired");
          localStorage.removeItem("token");
          if (isMounted) setSecurityStatus(1);
          navigate("/");
          return;
        }

        const data = await res.json();
        console.log("Security check result:", data);

        if (data?.email && isMounted) {
          setSecurityStatus(0);
        } else {
          console.warn("Invalid security response, redirecting...");
          localStorage.removeItem("token");
          if (isMounted) setSecurityStatus(1);
          navigate("/");
        }
      } catch (err) {
        console.error("Error during security check:", err);
        localStorage.removeItem("token");
        if (isMounted) setSecurityStatus(1);
        navigate("/");
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <ClientContext.Provider value={{ securityStatus }}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ClientContext.Provider>
  );
}
