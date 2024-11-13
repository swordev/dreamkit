import { DreamkitDevServer } from "../DreamkitDevServer.js";
import { createDreamkitDevServer } from "../adapters/solid-start/dev-server.js";
import { DreamkitPluginOptions } from "../options.js";
import { tryGenerate } from "../utils/ast.js";
import { TransformObject, transformCode } from "../utils/transform.js";
import { isVinxiBuild, onVinxiApp } from "../utils/vinxi.js";
import { Plugin } from "vite";

export function dreamkitPlugin(inOptions: DreamkitPluginOptions = {}): Plugin {
  let isSolidStart = false;
  let server: DreamkitDevServer;
  const cleanup = onVinxiApp(async (app) => {
    server = createDreamkitDevServer(app, inOptions);
    if (!isVinxiBuild()) await server.start();
  });
  return {
    name: "dreamkit",
    enforce: "pre",
    ["dreamkitOptions" as any]: inOptions,
    config(config) {
      isSolidStart = !!(config as any).app;
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
      const transforms: TransformObject[] = [{ toSolidLink: true }];

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
      const result = tryGenerate(ast);
      return result;
    },
  };
}
