import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://neuros.gokart.studio",
  output: "server",
  adapter: vercel(),
  integrations: [react()],
});
