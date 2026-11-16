import { useEffect, useRef } from "react";
import { motion } from "motion/react";

// Modal berbasis <dialog> + showModal(): halaman di belakang jadi inert (Tab tidak keluar),
// Esc dan klik di luar panel memanggil onClose, fokus kembali ke tombol pembuka saat ditutup.
// <dialog> dibuat selebar layar (latar gelap ada di dialog itu sendiri), panel ada di children.
// Props motion (initial/animate/exit/transition) diteruskan supaya bisa dipakai di AnimatePresence.
export default function Modal({ label, onClose, className = "", children, ...motionProps }) {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    ref.current.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <motion.dialog
      ref={ref}
      aria-label={label}
      // Esc: tahan penutupan bawaan supaya state React (dan animasi keluar) yang menutup
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Cadangan kalau browser tetap menutup dialog tanpa event cancel
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 p-0 backdrop:bg-transparent open:flex ${className}`}
      {...motionProps}
    >
      {children}
    </motion.dialog>
  );
}
