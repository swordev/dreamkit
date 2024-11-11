import {
  DreamkitDevInOptions,
  DreamkitDevServer,
} from "../DreamkitDevServer.js";
import { generate } from "../actions/generate.js";
import { DreamkitPluginOptions } from "../options.js";
import { generateIfChanges } from "../utils/ast.js";
import { execute } from "../utils/runtime.js";
import { createDelayedFunction } from "../utils/timeout.js";
import { transformCode } from "../utils/transform.js";
import {
  BaseFileSystemRouter,
  onChangeVinxiRoutes,
  VinxiRoute,
} from "../utils/vinxi.js";
import { isRoute, Route, $route } from "@dreamkit/app";
import { join, resolve } from "path";
import { App } from "vinxi";
import { Plugin } from "vite";

const isEntryRoute = (id: string, value: unknown): value is Route =>
  !id.startsWith("/") && isRoute(value);

export async function fetchDreamkitDevOptions(options: {
  root: string;
}): Promise<DreamkitDevInOptions> {
  const entry = join(options.root, "app.config.ts").replaceAll("\\", "/");
  const dummyDefineConfigSource = "virtual:config";
  const result = await execute(entry, [
    {
      name: "dk:options",
      resolveId(source) {
        if (source === dummyDefineConfigSource) return `\0${source}`;
      },
      load(id, options) {
        if (id === `\0${dummyDefineConfigSource}`) {
          return {
            code: "export const defineConfig = (value) => value",
          };
        }
      },
      transform(code, file) {
        if (file === entry) {
          const ast = transformCode(code, {
            replaceImportSpec: {
              source: "@solidjs/start/config",
              spec: ["defineConfig"],
              newSource: dummyDefineConfigSource,
            },
          });

          return generateIfChanges(ast);
        }
      },
    },
  ]);
  const vinxiApp: {
    appRoot?: string;
    routeDir?: string;
    vite?: {
      plugins?: (Plugin & { dreamkitOptions: DreamkitPluginOptions })[];
    };
  } = result.default;

  const dreamkitPlugin = vinxiApp.vite?.plugins?.find(
    (plugin) => plugin.name === "dreamkit",
  );

  if (!dreamkitPlugin) throw new Error("'dreamkit' plugin not found");

  return {
    root: options.root,
    routeDir: join(
      options.root,
      vinxiApp.appRoot ?? "src",
      vinxiApp.routeDir ?? "routes",
    ),
    ...dreamkitPlugin.dreamkitOptions,
  };
}

export function createDreamkitDevServer(
  vinxiApp: App,
  inOptions: DreamkitPluginOptions = {},
) {
  const ssrRouter = vinxiApp.config.routers.find(
    (config) => config.name === "ssr",
  )!.internals.routes as BaseFileSystemRouter;
  const server = new DreamkitDevServer({
    root: resolve(vinxiApp.config.root ?? "."),
    routeDir: ssrRouter.config.dir,
    ...inOptions,
  });

  async function onBuildStart() {
    await server.prepare(false);
    for (const router of vinxiApp.config.routers) {
      if (router.name === "ssr" || router.name === "client") {
        const internalRouter = router.internals.routes;
        const routes = (await internalRouter?.getRoutes()) || [];
        for (const vinxiRoute of routes) {
          const routeObject = await server.fetchDefault(vinxiRoute.filePath);
          if (isRoute(routeObject))
            vinxiRoute.$$route = {
              pick: ["route"],
              src: vinxiRoute.filePath,
            };
        }
      }
    }
  }

  async function onBuildEnd() {
    await server.stop();
  }

  async function onDevStart() {
    await server.prepare(true);
    for (const router of vinxiApp.config.routers) {
      const internalRouter = router.internals.routes;
      if (internalRouter) {
        onChangeVinxiRoutes(internalRouter, async (action, vinxiRoute) => {
          const isVinxiRouterPage =
            vinxiRoute.page &&
            !vinxiRoute._dreamkitEntryId &&
            (router.name === "ssr" || router.name === "client");
          if (!isVinxiRouterPage) return;
          const id = vinxiRoute.path;
          if (action === "remove") {
            if (router.name === "ssr" && server.app.objects.has(id))
              await server.app.remove([id]);
          } else if (action === "add" || action === "update") {
            const routeObject = await server.fetchDefault(vinxiRoute.filePath);
            if (isRoute(routeObject))
              vinxiRoute.$$route = {
                pick: ["route"],
                src: vinxiRoute.filePath,
              };
            if (router.name === "ssr") {
              await server.app.add({
                [id]: $route["clone"]({ filePath: vinxiRoute.filePath })
                  .params(
                    isRoute(routeObject)
                      ? routeObject.$options.params?.props || {}
                      : {},
                  )
                  .path(vinxiRoute.path)
                  .create(() => {}),
              });
            }
          }
        });
      }
    }

    const tryGenerate = createDelayedFunction(() => generate(server), 300);

    server.app
      .on("change", (data) => {
        if (isRoute(data.value)) {
          tryGenerate();
        }
      })
      .on("add", async ({ id, value }) => {
        if (isEntryRoute(id, value)) {
          for (const config of vinxiApp.config.routers) {
            if (config.name === "ssr" || config.name === "client") {
              const routes = config.internals.routes!;
              const vinxiRoute: VinxiRoute = {
                _dreamkitEntryId: id,
                page: true,
                $component: {
                  src: `${server.entry.path}?dk-pick-entry=${id}&pick=default&`,
                  pick: ["default", "$css"],
                },
                $$route: {
                  src: `${server.entry.path}?dk-pick-entry=${id}&pick=route&`,
                  pick: ["route"],
                },
                path: value.$options.path ?? "",
                filePath: server.entry.path,
              };
              if (!value.$options.path) {
                console.warn("Missing route path", { id });
                continue;
              }
              routes._addRoute(vinxiRoute);
              routes.dispatchEvent(
                new CustomEvent("reload", {
                  detail: { route: vinxiRoute, dreamkitRoute: true },
                }),
              );
            }
          }
        }
      })
      .on("remove", ({ id, value }) => {
        if (isEntryRoute(id, value)) {
          for (const config of vinxiApp.config.routers) {
            if (config.name === "ssr" || config.name === "client") {
              const routes = config.internals.routes!;
              routes.routes = routes.routes.filter((r) => r._id !== id);
              routes.dispatchEvent(
                new CustomEvent("reload", {
                  detail: { dreamkitRoute: true },
                }),
              );
            }
          }
        }
      });
  }

  vinxiApp.hooks.hook("app:build:router:start", onBuildStart);
  vinxiApp.hooks.hook("app:build:router:vite:end", onBuildEnd);
  vinxiApp.hooks.hook("app:build:nitro:start", onBuildStart);
  vinxiApp.hooks.hook("app:build:nitro:end", onBuildEnd);
  vinxiApp.hooks.hook("app:dev:start", onDevStart);
}
