import { defineConfig } from "@solidjs/start/config";
import { dreamkitPlugin } from "dreamkit/dev";

export default defineConfig({
  vite: {
    plugins: [dreamkitPlugin()],
  },
});
