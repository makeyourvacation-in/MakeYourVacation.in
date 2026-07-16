import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import LuxuryLoader from "@/components/LuxuryLoader";

import Home from "@/pages/Home";
import Packages from "@/pages/Packages";
import PackageDetails from "@/pages/PackageDetails";
import Destinations from "@/pages/Destinations";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { AuthProvider } from "@/lib/auth";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children }) {
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/admin");
  return (
    <>
      {!bare && <Navbar />}
      <main>{children}</main>
      {!bare && <Footer />}
      {!bare && <FloatingButtons />}
    </>
  );
}

function App() {
  return (
    <div className="App">
      <LuxuryLoader />
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/packages/:id" element={<PackageDetails />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
