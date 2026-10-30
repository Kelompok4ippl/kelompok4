import { useEffect } from "react";

// Animasi saat scroll untuk elemen di dalam rootRef:
// - data-reveal="up|left|right|zoom" → muncul (fade + slide) saat masuk layar, sekali saja.
//   Jeda bisa diatur lewat style --reveal-delay, contoh: style={{ "--reveal-delay": "150ms" }}
// - data-parallax="0.3" → bergerak lebih lambat dari scroll (angka negatif = lebih cepat / berlawanan).
// - data-scroll-fade → memudar & naik pelan-pelan saat bagian induknya di-scroll keluar layar (teks hero).
// - data-scroll-progress → lebarnya mengikuti seberapa jauh halaman sudah di-scroll (bar di atas).
//   Tambahkan data-parallax-anchor="top" supaya elemen diam di posisi awal saat halaman paling atas
//   dan baru turun pelan-pelan ketika di-scroll (cocok untuk foto hero).
// Kalau pengguna memilih "kurangi animasi" di perangkatnya, semua langsung tampil tanpa gerakan.
export function useScrollEffects(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    root.classList.add("reveal-ready");

    // ---------- Reveal ----------
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    const watch = () => root.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    watch();
    // Kartu kos dimuat belakangan (dan berganti saat filter), jadi elemen baru ikut dipantau
    const mutation = new MutationObserver(watch);
    mutation.observe(root, { childList: true, subtree: true });

    // ---------- Parallax ----------
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      root.querySelectorAll("[data-parallax]").forEach((el) => {
        const box = (el.parentElement || el).getBoundingClientRect();
        if (box.bottom < -200 || box.top > window.innerHeight + 200) return; // di luar layar, lewati
        const speed = Number(el.dataset.parallax) || 0;
        const offset = el.dataset.parallaxAnchor === "top"
          ? Math.max(0, -box.top) * speed
          : (middle - (box.top + box.height / 2)) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      root.querySelectorAll("[data-scroll-fade]").forEach((el) => {
        const box = (el.parentElement || el).getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -box.top / (box.height * 0.6)));
        el.style.opacity = String(1 - p);
        el.style.transform = `translate3d(0, ${(-p * 80).toFixed(1)}px, 0) scale(${(1 - p * 0.08).toFixed(3)})`;
      });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.querySelectorAll("[data-scroll-progress]").forEach((el) => {
        el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      mutation.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.classList.remove("reveal-ready");
    };
  }, [rootRef]);
}
