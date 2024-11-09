// @ts-check
import solidJs from "@astrojs/solid-js";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    solidJs(),
    starlight({
      title: "dreamkit",
      social: {
        github: "https://github.com/swordev/dreamkit",
      },
      sidebar: [
        {
          label: "Get started",
          link: "/get-started",
        },
        {
          label: "API",
          items: [
            {
              label: "Input",
              link: "/api/input",
            },
            {
              label: "$route",
              link: "/api/$route",
            },
            {
              label: "routePath",
              link: "/api/route-path",
            },
            {
              label: "Link",
              link: "/api/link",
            },
            {
              label: "createAction",
              link: "/api/create-action",
            },
          ],
        },
        {
          label: "Commands",
          items: [
            {
              label: "generate",
              link: "/commands/generate",
            },
          ],
        },
      ],
    }),
  ],
});
