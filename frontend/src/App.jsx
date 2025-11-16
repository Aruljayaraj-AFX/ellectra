// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayouts";
const Home = lazy(() => import("./Pages/Home"));
import Shop from "./components/Shop";
import Product from "./components/Product";
import Cart from "./components/Cart";
import Profile from "./components/Profile";
import Test from "./components/test";
import Cartoper from "./components/cartcrud";
import Proadmin from "./components/product-admin";
import VisitingCard from "./components/visitingcard";
import Orderadmin from "./components/admin-order";

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} /> 
          <Route path="/Shop" element={<Shop />} /> 
          <Route path="/Shop/Product" element={<Product />} /> 
          <Route path="/Cart" element={<Cart />} /> 
          <Route path="/Profile" element={<Profile />} />
          <Route path="/admin-testforupload" element={<Test />} />
          <Route path="/admin-catogeries" element={<Cartoper />} />
          <Route path="/admin-pro" element={<Proadmin />} />
          <Route path="/admin-order" element={<Orderadmin />} />
        </Route>
        <Route
          path="/welcome-dude/visting-via/qr-code"
          element={<VisitingCard />}
        />
      </Routes>
    </Suspense>
  );
}
