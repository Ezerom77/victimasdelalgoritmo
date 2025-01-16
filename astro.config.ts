import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import UnoCSS from "unocss/astro";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";

export default defineConfig({
  // used to generate images
  site:
    process.env.VERCEL_ENV === "production"
      ? "https://victimasdelalgoritmo.com.ar/"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/`
        : "https://victimasdelalgoritmo.com.ar/",
  trailingSlash: "ignore",
  integrations: [
    sitemap(),
    UnoCSS({ injectReset: true }),
    mdx(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  headers: {
    // Cache estático para assets
    "/*.{js,css,jpg,jpeg,png,gif,ico,svg,woff,woff2}": [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
    // Cache para páginas HTML
    "/*.html": [
      {
        key: "Cache-Control",
        value: "public, max-age=3600, must-revalidate",
      },
    ],
    // Cache para el feed RSS
    "/feed.xml": [
      {
        key: "Cache-Control",
        value: "public, max-age=3600, must-revalidate",
      },
    ],
  },
});
