import { createRoot } from "react-dom/client";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import React, { useEffect, useState } from "react";

function MermaidLightbox() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentSvg, setCurrentSvg] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const processedSvgs = new WeakSet<Element>();

    const initZoom = () => {
      const allSvgs = document.querySelectorAll("svg[id^='mermaid']");

      allSvgs.forEach((svg) => {
        if (processedSvgs.has(svg)) return;

        processedSvgs.add(svg);
        (svg as HTMLElement).style.cursor = "zoom-in";

        svg.addEventListener("click", () => {
          const svgElement = svg as SVGSVGElement;
          const bbox = svgElement.getBBox();
          const width = Math.max(bbox.width, 1920);
          const height = Math.max(bbox.height, 1080);

          const clonedSvg = svg.cloneNode(true) as SVGElement;
          clonedSvg.setAttribute("width", width.toString());
          clonedSvg.setAttribute("height", height.toString());

          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(clonedSvg);
          const svgBlob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);

          setCurrentSvg(url);
          setLightboxOpen(true);
        });
      });
    };

    const timer = setTimeout(initZoom, 500);

    const observer = new MutationObserver((mutations) => {
      const hasArticleChange = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === 1 &&
            ((node as Element).tagName === "ARTICLE" ||
              (node as Element).closest("article"))
        )
      );

      if (hasArticleChange) {
        initZoom();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <Lightbox
      open={lightboxOpen}
      close={() => setLightboxOpen(false)}
      slides={[{ src: currentSvg }]}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 5,
        scrollToZoom: true,
        doubleClickMaxStops: 3,
      }}
      carousel={{
        finite: true,
        imageFit: "contain",
      }}
      controller={{ closeOnBackdropClick: true }}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      styles={{
        root: {
          "--yarl__color_backdrop": isDarkMode
            ? "rgba(0, 0, 0, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
        } as Record<string, string>,
      }}
    />
  );
}

export default function initMermaidZoom(): void {
  if (typeof window === "undefined") {
    return;
  }

  const containerId = "mermaid-lightbox-container";
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<MermaidLightbox />);
  }
}
