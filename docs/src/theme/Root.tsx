import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import React, { useEffect, useState } from "react";

export default function Root({ children }: { children: React.ReactNode }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentSvg, setCurrentSvg] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // ダークモードの検出
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // data-theme属性の変更を監視
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
          // SVGをData URLに変換
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svg);
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
    <>
      {children}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={[{ src: currentSvg }]}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        carousel={{ finite: true }}
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
    </>
  );
}
