// Scroll-triggered animation hook (guide 2.2)
// Uses IntersectionObserver to add .visible class when elements enter viewport
import { useEffect, useRef } from "react";

/**
 * useScrollReveal — attaches IntersectionObserver to a container ref.
 * All children with class "reveal" will animate in when 20% visible.
 * Stagger children with reveal-delay-1, reveal-delay-2, etc.
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // animate only once
          }
        });
      },
      { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || "0px" }
    );

    const elements = container.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * ScrollReveal wrapper component — wraps children in an observed container.
 */
export function ScrollReveal({ children, className = "", ...props }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
}

/**
 * useWordReveal — splits text into word spans and animates them in sequence.
 * Returns a ref to attach to the text container element.
 */
export function useWordReveal(delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const text = el.textContent;
    const words = text.split(" ");
    el.innerHTML = "";

    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.textContent = word + " ";
      span.style.display = "inline-block";
      span.style.opacity = "0";
      span.style.transform = "translateY(16px)";
      span.style.filter = "blur(4px)";
      span.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
      span.style.transitionDelay = `${delay + i * 0.08}s`;
      el.appendChild(span);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const spans = el.querySelectorAll("span");
            spans.forEach((s) => {
              s.style.opacity = "1";
              s.style.transform = "translateY(0)";
              s.style.filter = "blur(0)";
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}
