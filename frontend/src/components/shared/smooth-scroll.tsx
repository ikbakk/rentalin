"use client";

import { ReactLenis } from "lenis/react";

/** One document scroll controller for public and workspace routes. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        autoToggle: true,
        anchors: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        respectReducedMotion: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
