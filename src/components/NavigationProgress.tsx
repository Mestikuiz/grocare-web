import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// Scroll to top + teal progress bar on every route change
export default function NavigationProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    // Scroll to top instantly
    window.scrollTo({ top: 0, behavior: "instant" });

    // Clear any running animation
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);

    // Start bar
    setProgress(0);
    setVisible(true);

    // Animate: 0 → 85 quickly, pause, then 100 + hide
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      // Ease to 85% in 300ms
      const p = Math.min(85, (elapsed / 300) * 85);
      setProgress(p);
      if (p < 85) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Jump to 100 after short pause
        timerRef.current = setTimeout(() => {
          setProgress(100);
          timerRef.current = setTimeout(() => setVisible(false), 300);
        }, 100);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    };
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 3, zIndex: 9999, pointerEvents: "none",
    }}>
      <div style={{
        height: "100%",
        width: `${progress}%`,
        background: "linear-gradient(90deg, #2382AA, #34b8e0)",
        transition: progress === 100 ? "width 0.2s ease, opacity 0.3s ease" : "width 0.1s linear",
        opacity: progress === 100 ? 0 : 1,
        boxShadow: "0 0 8px #2382AA99",
        borderRadius: "0 2px 2px 0",
      }} />
    </div>
  );
}
