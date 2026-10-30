import { useEffect, useState } from "react";

// Adaptasi "Text Rotate" (danielpetho, 21st.dev) tanpa library motion:
// kata berganti tiap `interval` ms, tiap huruf naik masuk satu per satu (lihat .kekos-rotate di index.css).
export default function TextRotate({ texts, interval = 2200, className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % texts.length), interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  const word = texts[index];
  return (
    <span className={`kekos-rotate ${className}`}>
      <span className="sr-only">{word}</span>
      {/* key={index} membuat huruf dipasang ulang, jadi animasinya diputar lagi tiap ganti kata */}
      <span key={index} aria-hidden="true" className="inline-flex">
        {Array.from(word).map((char, i) => (
          <span key={i} style={{ "--i": i }}>
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}
