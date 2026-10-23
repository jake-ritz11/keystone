"use client";

import { useEffect } from "react";

/**
 * Marks <html data-hydrated> once React has attached its handlers. The behavior tests wait for
 * it, so they never press a key the page can't handle yet.
 */
export function Hydrated() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
  }, []);
  return null;
}
