import { useCallback, useEffect, useRef, useState } from "react";

// Deretan kartu yang bisa digeser ke samping dengan:
// drag mouse, roda mouse (scroll atas/bawah jadi geser kiri/kanan), swipe di HP, dan tombol panah.
// Kembalikan { ref, canPrev, canNext, slide } — slide(1) ke kanan, slide(-1) ke kiri.
export function useDragScroll() {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ canPrev: false, canNext: false });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      canPrev: el.scrollLeft > 2,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    function onPointerDown(e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    }
    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        moved = true;
        el.style.cursor = "grabbing";
        el.style.scrollSnapType = "none";
      }
      if (moved) el.scrollLeft = startLeft - dx;
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "";
      el.style.scrollSnapType = "";
    }
    // Setelah drag, klik pada tombol/link di kartu diabaikan supaya tidak pindah halaman
    function onClick(e) {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    }
    // Roda mouse atas/bawah menggeser kartu, kecuali kalau sudah mentok (halaman tetap bisa discroll)
    function onWheel(e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
    function onDragStart(e) {
      e.preventDefault(); // cegah gambar/link ikut terseret
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("scroll", updateEdges, { passive: true });
    const resize = new ResizeObserver(updateEdges);
    resize.observe(el);
    // Isi kartu bisa berubah (hasil filter), jadi pantau juga perubahan isinya
    const mutation = new MutationObserver(updateEdges);
    mutation.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("scroll", updateEdges);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [updateEdges]);

  const slide = useCallback((direction) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * Math.max(346, el.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  return { ref, ...edges, slide };
}
