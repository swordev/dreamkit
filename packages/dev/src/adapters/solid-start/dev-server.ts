import {
  DreamkitDevInOptions,
  DreamkitDevServer,
} from "../../DreamkitDevServer.js";
import { generateMeta } from "../../actions/generate-meta.js";
import { generateSettings } from "../../actions/generate-settings.js";
import { DreamkitPluginOptions } from "../../options.js";
import { tryGenerate } from "../../utils/ast.js";
import { log } from "../../utils/log.js";
import { execute } from "../../utils/runtime.js";
import { createDelayedFunction } from "../../utils/timeout.js";
import { transformCode } from "../../utils/transform.js";
import {
  addVinxiPlugin,
  addVinxiRollupPlugin,
  BaseFileSystemRouter,
  isVinxiBuild,
  onChangeVinxiRoutes,
  VinxiApp,
  VinxiRoute,
} from "../../utils/vinxi.js";
import { isRoute, Route, $route, App, isSettings } from "@dreamkit/app";
import { existsSync } from "fs";
import { join, normalize, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { Plugin } from "vite";

const isEntryRoute = (id: string, value: unknown): value is Route =>
  !id.startsWith("/") && isRoute(value);

// StackBlitz Polyfill

class $CustomEvent extends Event {
  public detail: any;
  constructor(message: string, data?: { detail: any }) {
    super(message);
    this.detail = data?.detail;
  }
}

const CustomEvent = globalThis.CustomEvent ?? $CustomEvent;

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
          return tryGenerate(ast);
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

function addVinxiEntryRoutes(
  vinxiApp: VinxiApp,
  objectId: string,
  objectValue: Route,
  entryPath: string,
) {
  for (const config of vinxiApp.config.routers) {
    if (config.name === "ssr" || config.name === "client") {
      const routes = config.internals.routes!;
      const vinxiRoute: VinxiRoute = {
        _dreamkitEntryId: objectId,
        page: true,
        $component: {
          src: `${entryPath}?dk-pick-entry=${objectId}&pick=default&`,
          pick: ["default", "$css"],
        },
        $$route: {
          src: `${entryPath}?dk-pick-entry=${objectId}&pick=route&`,
          pick: ["route"],
        },
        path: objectValue.$options.path ?? "",
        filePath: entryPath,
      };
      if (!objectValue.$options.path) {
        console.warn("Missing route path at dreamkit entry", { id: objectId });
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

export function createDreamkitDevServer(
  vinxiApp: VinxiApp,
  inOptions: DreamkitPluginOptions = {},
) {
  const ssrFileRouter = vinxiApp.config.routers.find(
    (config) => config.name === "ssr",
  )!.internals.routes as BaseFileSystemRouter;
  const server = new DreamkitDevServer({
    root: resolve(vinxiApp.config.root ?? "."),
    routeDir: ssrFileRouter.config.dir,
    ...inOptions,
  });

  DreamkitDevServer.saveInstance(server);
  App.saveInstance(server.app);

  const selfPath = (file: string, rel?: boolean) => {
    const path = fileURLToPath(new URL(`./${file}`, import.meta.url));
    return normalize(rel ? relative(server.options.root, path) : path);
  };

  async function onBuildStart() {
    await server.prepare(false);
    for (const route of server.app.routes) {
      const id = server.app.getObjectId(route);
      if (isEntryRoute(id, route))
        addVinxiEntryRoutes(vinxiApp, id, route, server.entry.path);
    }
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
    const tryGenerateMeta = createDelayedFunction(async () => {
      log("generating meta");
      const paths = new Set<string>();
      server.app.routes.forEach(async (route) => {
        const path = route.$options.path;
        if (path) {
          if (paths.has(path)) {
            console.warn("Duplicated route path", { path });
          }
          paths.add(path);
        }
      });
      await generateMeta(server);
    }, 300);
    const tryGenerateSettings = createDelayedFunction(async () => {
      log("generating settings");
      await generateSettings(server);
    }, 300);
    server.app
      .on("change", (data) => {
        log("change detected", { action: data.action, id: data.id });
        if (isRoute(data.value)) {
          tryGenerateMeta();
        } else if (isSettings(data.value)) {
          tryGenerateSettings();
        }
      })
      .on("add", async ({ id, value }) => {
        if (isEntryRoute(id, value)) {
          addVinxiEntryRoutes(vinxiApp, id, value, server.entry.path);
        }
      })
      .on("remove", ({ id, value }) => {
        if (isEntryRoute(id, value)) {
          for (const config of vinxiApp.config.routers) {
            if (config.name === "ssr" || config.name === "client") {
              const routes = config.internals.routes!;
              routes.routes = routes.routes.filter(
                (r) => r._dreamkitEntryId !== id,
              );
              routes.dispatchEvent(
                new CustomEvent("reload", {
                  detail: { dreamkitRoute: true },
                }),
              );
            }
          }
        }
      });

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
          if (router.name === "ssr" && server.app.objects.has(id))
            await server.app.remove([id]);

          if (action === "add" || action === "update") {
            const routeObject = await server.fetchRoute(vinxiRoute.filePath);
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

    await server.start();
  }

  const ssrRouter = vinxiApp.getRouter("ssr");
  ssrRouter.middleware = selfPath("middleware.js", true);

  if (isVinxiBuild()) {
    const dreamkitEntryId = "dk:entry";
    const dreamkitPreEntriesId = "dk:pre-entries";
    const dreamkitEntry = join(
      server.options.root,
      "src/dreamkit.tsx",
    ).replaceAll("\\", "/");
    const existsDreamkitEntry = existsSync(dreamkitEntry);
    addVinxiPlugin(vinxiApp, selfPath("prod-server.js"));
    addVinxiRollupPlugin(vinxiApp, {
      name: "dk:entry",
      resolveId(id) {
        if (id === dreamkitEntryId) {
          return existsDreamkitEntry ? dreamkitEntry : `\0${dreamkitEntryId}`;
        } else if (id === dreamkitPreEntriesId) {
          return `\0${dreamkitPreEntriesId}`;
        }
      },
      load(id) {
        if (!existsDreamkitEntry && id === `\0${dreamkitEntryId}`)
          return { code: "export {}" };

        if (id === `\0${dreamkitPreEntriesId}`) {
          const exports = server.options.preEntries?.map(
            (entry, index) =>
              `export * as entry_${index} from ${JSON.stringify(entry)};`,
          );

          return { code: [...exports, `export {};`].join("\n") };
        }
      },
    });
  }

  vinxiApp.hooks.hook("app:build:router:start", onBuildStart);
  vinxiApp.hooks.hook("app:build:router:vite:end", onBuildEnd);
  vinxiApp.hooks.hook("app:build:nitro:start", onBuildStart);
  vinxiApp.hooks.hook("app:build:nitro:end", onBuildEnd);
  vinxiApp.hooks.hook("app:dev:start", onDevStart);

  return server;
}
