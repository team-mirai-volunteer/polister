import type mapboxgl from "mapbox-gl";
import { useEffect } from "react";

export function useMapResize(
  mapInstance: mapboxgl.Map | null,
  containerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    let raf = 0;
    const scheduleResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        mapInstance.resize();
        raf = 0;
      });
    };

    scheduleResize();

    const target = containerRef.current;
    const supportsObserver =
      typeof window !== "undefined" && typeof ResizeObserver !== "undefined";
    let observer: ResizeObserver | undefined;

    if (supportsObserver && target) {
      observer = new ResizeObserver(() => {
        scheduleResize();
      });
      observer.observe(target);
    }

    const hasWindow = typeof window !== "undefined";
    if (hasWindow) {
      window.addEventListener("resize", scheduleResize);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (hasWindow) {
        window.removeEventListener("resize", scheduleResize);
      }
      cancelAnimationFrame(raf);
    };
  }, [mapInstance, containerRef]);
}
