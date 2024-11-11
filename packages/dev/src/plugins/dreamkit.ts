import { createDreamkitDevServer } from "../adapters/solid-start.js";
import { DreamkitPluginOptions } from "../options.js";
import { replaceImportSpec } from "../transforms/replace-import-spec.js";
import { generateIfChanges } from "../utils/ast.js";
import { Transform, transformCode } from "../utils/transform.js";
import { onVinxiApp } from "../utils/vinxi.js";
import { Plugin } from "vite";

export function dreamkitPlugin(inOptions: DreamkitPluginOptions = {}): Plugin {
  let isSolidStart = false;
  const cleanup = onVinxiApp((app) => createDreamkitDevServer(app, inOptions));
  return {
    name: "dreamkit",
    enforce: "pre",
    ["dreamkitOptions" as any]: inOptions,
    config(config) {
      isSolidStart = !!config.app;
      if (!isSolidStart) cleanup();
    },
    configResolved(config) {
      if (isSolidStart)
        (config as any).plugins = config.plugins?.filter(
          (plugin) => (plugin as Plugin).name !== "tree-shake",
        );
    },
    async transform(code, id) {
      const [, searchString] = id.split("?");
      const searchParams = new URLSearchParams(searchString);
      const dreamkitPickEntry = searchParams.get("dk-pick-entry");
      const picks = searchParams.getAll("pick");
      const transforms: Transform[] = [];

      if (code.includes("'dreamkit'") || code.includes('"dreamkit"'))
        transforms.push({
          replaceImportSpec: {
            source: "dreamkit",
            spec: ["Link"],
            newSource: "dreamkit/adapters/solid.js",
          },
        });

      if (dreamkitPickEntry) {
        transforms.push({
          pickExport: [dreamkitPickEntry],
          noExport: [dreamkitPickEntry],
          exportDefault: dreamkitPickEntry,
          toSolidRoute: true,
        });
      }

      if (picks.length) {
        transforms.push({
          ...(!transforms.some((v) => v.toSolidRoute) && {
            toSolidRoute: true,
          }),
          pickExport: picks,
        });
      }

      const ast = transformCode(code, ...transforms);
      const result = generateIfChanges(ast);
      return result;
    },
  };
}
