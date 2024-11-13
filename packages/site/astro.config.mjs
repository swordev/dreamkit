// @ts-check
import solidJs from "@astrojs/solid-js";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let projectRoot;
let solidStartTemplateFiles;

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      {
        name: "dk:solid-start-template",
        async configResolved(config) {
          projectRoot = join(config.root, "../..");
          solidStartTemplateFiles = readFiles(
            join(projectRoot, "./templates/solid-start"),
            [
              "src/app.tsx",
              "src/entry-client.tsx",
              "src/entry-server.tsx",
              "src/global.d.ts",
              ".gitignore",
              "README.md",
              "app.config.ts",
              "package.json",
              "tsconfig.json",
            ],
          );
          const pkg = JSON.parse(solidStartTemplateFiles["package.json"]);
          const dreamkitPkg = JSON.parse(
            readFileSync(
              join(projectRoot, "packages/dreamkit/package.json"),
            ).toString(),
          );
          pkg.dependencies.dreamkit = `^${dreamkitPkg.version}`;
          solidStartTemplateFiles["package.json"] = JSON.stringify(
            pkg,
            null,
            2,
          );
        },
        resolveId(id) {
          if (id === "solid-start-template") {
            return `\0${id}`;
          }
        },
        load(id) {
          if (id === "\0solid-start-template") {
            return {
              code: `export default ${JSON.stringify(solidStartTemplateFiles)}`,
            };
          }
        },
      },
    ],
  },

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
          label: "Entry",
          link: "/entry",
        },
        {
          label: "API",
          items: [
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
            {
              label: "Input",
              link: "/api/input",
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

/**
 *
 * @param {string} path
 * @param {string[]} files
 */
function readFiles(path, files) {
  let result = {};
  for (const file of files) {
    const filePath = join(path, file);
    const buffer = readFileSync(filePath).toString();
    result[file] = buffer.toString();
  }
  return result;
}