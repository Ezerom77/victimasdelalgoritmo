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
});
