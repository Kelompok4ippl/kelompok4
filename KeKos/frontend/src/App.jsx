import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DetailKos from "./pages/DetailKos";
import BookingKos from "./pages/BookingKos";
import PemilikKos from "./pages/PemilikKos";
import PemilikKamar from "./pages/PemilikKamar";
import PemilikNotifikasi from "./pages/PemilikNotifikasi";
import RequireRole from "./components/RequireRole";

const pencari = (page) => <RequireRole role="pencari">{page}</RequireRole>;
const pemilik = (page) => <RequireRole role="pemilik">{page}</RequireRole>;

// Halaman lama memudar keluar, lalu halaman baru memudar masuk.
// Sengaja hanya opacity: transform di pembungkus akan merusak elemen position:fixed di dalam halaman.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Routes location={location}>
          {/* Masuk & daftar */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/buat-akun" element={<Navigate to="/register" replace />} />

          {/* Pencari kos */}
          <Route path="/dashboard" element={pencari(<Dashboard />)} />
          <Route path="/notifikasi" element={pencari(<Dashboard notifOpenInitially />)} />
          <Route path="/kos/:id" element={<DetailKos />} />
          <Route path="/kos/:id/booking" element={pencari(<BookingKos />)} />

          {/* Pemilik kos */}
          <Route path="/pemilik" element={<Navigate to="/pemilik/kos" replace />} />
          <Route path="/pemilik/kos" element={pemilik(<PemilikKos />)} />
          <Route path="/pemilik/kamar" element={pemilik(<PemilikKamar />)} />
          <Route path="/pemilik/notifikasi" element={pemilik(<PemilikNotifikasi />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    // reducedMotion="user": animasi Motion ikut mati kalau pengguna memilih "kurangi animasi", sama seperti animasi CSS
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </MotionConfig>
  );
}
