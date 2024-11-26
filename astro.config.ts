import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import UnoCSS from "unocss/astro";

export default defineConfig({
  // used to generate images
  site:
    process.env.VERCEL_ENV === "production"
      ? "https://victimasdelalgoritmo.com.ar/"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/`
        : // : "https://localhost:3000/",
          "https://victimasdelalgoritmo.com.ar/",
  trailingSlash: "ignore",
  integrations: [sitemap(), UnoCSS({ injectReset: true })],
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
});
