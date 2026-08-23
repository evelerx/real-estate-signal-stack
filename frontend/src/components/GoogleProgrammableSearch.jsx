import { useEffect, useId } from "react";

export default function GoogleProgrammableSearch({ searchEngineId }) {
  const id = useId().replace(/:/g, "");
  const containerId = `google-search-${id}`;

  useEffect(() => {
    const cx = String(searchEngineId || "").trim();
    if (!cx) return undefined;

    function renderSearch() {
      const element = window.google?.search?.cse?.element;
      if (element && !document.getElementById(containerId)?.children.length) {
        element.render({ div: containerId, tag: "search" });
      }
    }

    const existing = document.querySelector('script[data-google-cse="true"]');
    if (existing) {
      existing.addEventListener("load", renderSearch);
      renderSearch();
      return () => existing.removeEventListener("load", renderSearch);
    }

    window.__gcse = { parsetags: "explicit" };
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(cx)}`;
    script.dataset.googleCse = "true";
    script.addEventListener("load", renderSearch);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", renderSearch);
  }, [containerId, searchEngineId]);

  return <div id={containerId} className="google-programmable-search" />;
}
