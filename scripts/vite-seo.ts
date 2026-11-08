import type { Plugin } from "vite";
import {
  escapeMarkup,
  getPageMetadata,
  indexablePaths,
  nonIndexablePaths,
  renderPageMetadata,
  siteOrigin,
} from "../src/routing/seo.ts";

const placeholder = "<!-- page-seo -->";

export function seoPages(): Plugin {
  return {
    name: "seo-pages",
    transformIndexHtml(html, context) {
      if (!context.server) return;
      const path = (context.originalUrl ?? context.path).split(/[?#]/, 1)[0];
      return html.replace(placeholder, () => renderPageMetadata(getPageMetadata(path)));
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset" || typeof index.source !== "string" || !index.source.includes(placeholder)) {
          this.error("Missing page SEO placeholder in the built index.html");
        }
        const template = index.source;
        const render = (path: string) => template.replace(placeholder, () => renderPageMetadata(getPageMetadata(path)));

        index.source = render("/");
        for (const path of [...indexablePaths, ...nonIndexablePaths, "/overview", "/404"]) {
          if (path === "/") continue;
          // Cloudflare Pages serves flat HTML files at their extensionless URLs.
          this.emitFile({ type: "asset", fileName: `${path.slice(1)}.html`, source: render(path) });
        }

        const locations = indexablePaths.map((path) => `  <url><loc>${escapeMarkup(siteOrigin + path)}</loc></url>`);
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...locations,
            "</urlset>",
            "",
          ].join("\n"),
        });
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source: `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
        });
      },
    },
  };
}
