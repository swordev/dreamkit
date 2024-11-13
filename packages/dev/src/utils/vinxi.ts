import { normalize } from "path";
import type { InputOptionsWithPlugins, Plugin } from "rollup";
import type { App, Internals } from "vinxi";
import type { Router } from "vinxi/http";

export type VinxiApp = Omit<App, "getRouter"> & {
  config: {
    server?: App["config"]["server"] & {
      plugins?: string[];
      rollupConfig?: InputOptionsWithPlugins;
    };
  };
  getRouter(name: string): Router & {
    middleware?: string;
  };
};

export type VinxiRoute = {
  _dreamkitEntryId?: string;
  page: boolean;
  filePath: string;
  path: string;
  $component: {
    src: string;
    pick: string[];
  };
  $$route?: {
    src: string;
    pick?: string[];
    require?: any;
    import?: any;
  };
};

export type BaseFileSystemRouter = Omit<
  Internals["routes"] & {},
  "getRoutes"
> & {
  getRoutes(): Promise<VinxiRoute[]>;
  buildRoutes(): Promise<VinxiRoute[]>;
  buildRoutesPromise: Promise<any> | undefined;
};

export function isVinxiBuild() {
  return process.argv.slice(2).includes("build");
}

export function onVinxiApp(cb: (app: VinxiApp) => void) {
  Object.defineProperty(globalThis, "app", {
    configurable: true,
    set(value) {
      cb(value);
      Object.defineProperty(globalThis, "app", {
        configurable: true,
        value,
      });
    },
  });
  return () => {
    Object.defineProperty(globalThis, "app", {
      configurable: true,
      value: (globalThis as any).app,
    });
  };
}

export function addVinxiPlugin(vinxiApp: VinxiApp, path: string) {
  if (!vinxiApp.config.server.plugins) vinxiApp.config.server.plugins = [];
  vinxiApp.config.server.plugins.push(path);
}

export function addVinxiRollupPlugin(vinxiApp: VinxiApp, plugin: Plugin) {
  if (!vinxiApp.config.server.rollupConfig)
    vinxiApp.config.server.rollupConfig = { plugins: [] };
  if (!vinxiApp.config.server.rollupConfig.plugins)
    vinxiApp.config.server.rollupConfig.plugins = [];
  vinxiApp.config.server.rollupConfig.plugins.push(plugin);
}

export function onChangeVinxiRoutes(
  router: BaseFileSystemRouter,
  cb: (action: "add" | "update" | "remove", route: VinxiRoute) => any,
) {
  const addRoute = router._addRoute.bind(router);
  const removeRoute = router.removeRoute.bind(router);
  router._addRoute = (route) => {
    const prevRoute = router.routes.find((item) => item.path === route.path);
    const result = cb(prevRoute ? "update" : "add", route);
    if (result instanceof Promise) {
      result.then(() => addRoute(route));
    } else {
      addRoute(route);
    }
  };
  router.removeRoute = (src) => {
    src = normalize(src);
    if (router.isRoute(src)) {
      const path = router.toPath(src);
      if (path !== undefined) {
        const route = router.routes.find((r) => r.path === path);
        if (route) {
          const result = cb("remove", route);
          if (result instanceof Promise) {
            result.then(() => removeRoute(route));
          } else {
            removeRoute(route);
          }
        }
      }
    }
  };

  return () => {
    router._addRoute = addRoute;
    router.removeRoute = removeRoute;
  };
}
