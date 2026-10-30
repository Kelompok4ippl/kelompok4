import { useEffect, useRef } from "react";

// Membuat deretan kartu bergeser ke kanan sendiri, tapi tetap bisa digeser manual
// (scroll, swipe di HP, atau drag dengan mouse). Isi kontainer harus berisi
// daftar kartu yang ditulis 2x supaya putarannya menyambung.
export function useAutoSlide(speed = 40) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let paused = false;
    let resumeTimer = null;
    let frame = null;
    let last = performance.now();
    let pos = el.scrollWidth / 2; // mulai dari salinan kedua
    el.scrollLeft = pos;

    const half = () => el.scrollWidth / 2;

    // Jaga posisi tetap di tengah supaya bisa terus digeser ke dua arah
    function wrap() {
      if (pos <= 0) pos += half();
      if (pos >= half() * 1.5) pos -= half();
      el.scrollLeft = pos;
    }

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused && !reduceMotion) {
        pos -= speed * dt; // scrollLeft berkurang = kartu bergerak ke kanan
        wrap();
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    function pause() {
      paused = true;
      clearTimeout(resumeTimer);
    }
    function resumeLater() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => (paused = false), 1500);
    }

    // Scroll / swipe manual
    function onScroll() {
      if (paused) {
        pos = el.scrollLeft;
        if (pos <= 0 || pos >= half() * 1.5) wrap();
      }
    }

    // Drag dengan mouse
    let dragging = false;
    let startX = 0;
    let startPos = 0;
    function onPointerDown(e) {
      pause();
      if (e.pointerType !== "mouse") return;
      dragging = true;
      startX = e.clientX;
      startPos = el.scrollLeft;
      el.style.cursor = "grabbing";
    }
    function onPointerMove(e) {
      if (!dragging) return;
      pos = startPos - (e.clientX - startX);
      wrap();
    }
    function onPointerUp() {
      dragging = false;
      el.style.cursor = "";
      resumeLater();
    }

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", onPointerUp);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("touchend", resumeLater);
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resumeTimer);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", onPointerUp);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("touchend", resumeLater);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("scroll", onScroll);
    };
  }, [speed]);

  return ref;
}
