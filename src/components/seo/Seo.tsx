import { useEffect } from "react";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_NAME, SITE_URL, type JsonLd } from "@/lib/site";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: JsonLd;
  type?: string;
};

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });

  return element;
};

const ensureLink = (rel: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  return element;
};

const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
  type = "website",
}: SeoProps) => {
  useEffect(() => {
    const normalizedPath = path === "/" ? "/" : path.replace(/\/$/, "");
    const canonicalUrl = normalizedPath.startsWith("http") ? normalizedPath : `${SITE_URL}${normalizedPath}`;
    const robots = noindex ? "noindex, nofollow" : "index, follow";
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    ensureMeta('meta[name="description"]', { name: "description", content: description });
    ensureMeta('meta[name="author"]', { name: "author", content: SITE_NAME });
    ensureMeta('meta[name="robots"]', { name: "robots", content: robots });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: image });
    ensureMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    ensureMeta('meta[name="twitter:site"]', { name: "twitter:site", content: "@IntentusAI" });

    const canonical = ensureLink("canonical");
    canonical.setAttribute("href", canonicalUrl);

    const previousScript = document.head.querySelector<HTMLScriptElement>('script[data-intentus-jsonld="true"]');
    previousScript?.remove();

    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.intentusJsonld = "true";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const currentScript = document.head.querySelector<HTMLScriptElement>('script[data-intentus-jsonld="true"]');
      currentScript?.remove();
    };
  }, [description, image, jsonLd, noindex, path, title, type]);

  return null;
};

export default Seo;
