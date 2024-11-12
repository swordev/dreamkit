import {
  dreamkitPluginOptions,
  DreamkitPluginOptions,
  OutDreamkitPluginOptions,
} from "./options.js";
import { generateIfChanges } from "./utils/ast.js";
import { log } from "./utils/log.js";
import { getExt, resolvePath } from "./utils/path.js";
import { findFileRoutes } from "./utils/router.js";
import { VirtualShaking } from "./utils/shaking.js";
import {
  createTransformUrl,
  getUrlTransforms,
  Transform,
  transformAndGenerate,
  transformCodeByUrl,
  TransformObject,
} from "./utils/transform.js";
import { App, isRoute, Route, $route } from "@dreamkit/app";
import { existsSync } from "fs";
import { createServer, createViteRuntime, ViteDevServer } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPlugin from "vite-tsconfig-paths";
import { ViteRuntime } from "vite/runtime";

export type DreamkitDevExternalOptions = {
  root: string;
  routeDir: string;
};

export type DreamkitDevInOptions = DreamkitPluginOptions &
  DreamkitDevExternalOptions;
export type DreamkitDevOptions = OutDreamkitPluginOptions &
  DreamkitDevExternalOptions;

export class DreamkitDevServer {
  readonly app: App;
  readonly entry: VirtualShaking;
  protected runtimeServer: ViteDevServer | undefined;
  protected runtime: ViteRuntime | undefined;
  readonly options: DreamkitDevOptions;
  constructor(inOptions: DreamkitDevInOptions) {
    this.app = new App();
    const options = (this.options = {
      ...dreamkitPluginOptions,
      ...inOptions,
    });

    const vars = { defaults: options.root, root: options.root };
    options.entry = resolvePath(options.entry, vars);
    options.metaGlobalOutput = resolvePath(options.metaGlobalOutput, vars);
    options.metaLocalOutput = resolvePath(options.metaLocalOutput, vars);
    this.entry = new VirtualShaking({
      entry: options.entry,
      onChange: async (changes) => {
        log("entry changes", changes);
        const nextObjects = await this.fetchEntryObjects();
        const add: Record<string, any> = {};
        const remove: string[] = [];
        for (const change of changes) {
          if (change.action === "update" || change.action === "delete")
            if (this.app.objects.has(change.name)) remove.push(change.name);
          if (change.action === "create" || change.action === "update")
            add[change.name] = nextObjects[change.name];
        }
        await this.app.remove(remove);
        await this.app.add(add);
      },
    });
  }
  async fetch(path: string) {
    //const mod = $server.moduleGraph.getModuleById(shaking.entry);
    //if (mod) $server.moduleGraph.invalidateModule(mod);
    const ext = getExt(path);
    return await this.runtime!.executeUrl(`${path}?${Date.now()}&ext=${ext}`);
  }
  async fetchDefault<T>(path: string): Promise<T> {
    const result = await this.fetch(path);
    return result.default;
  }
  async fetchRoute(path: string): Promise<Route> {
    const url = createTransformUrl(path, { toSolidRoute: true });
    const result = await this.fetch(url);
    return result.default;
  }
  async findRouteObjects() {
    const files = await findFileRoutes(this.options.routeDir);
    const objects: Record<string, any> = {};
    for (const item of files) {
      const items = await this.fetch(item.filePath);
      for (const moduleKey in items) {
        const value = items[moduleKey];
        const objectId =
          moduleKey === "default" ? item.path : `${item.path}:${moduleKey}`;
        if (moduleKey === "default") {
          if (isRoute(value)) {
            objects[objectId] = value.$options.path
              ? $route
              : $route["clone"]({
                  ...value.$options,
                  path: item.path,
                }).create(value.$options.component!);
          } else if (typeof value === "function") {
            objects[objectId] = $route.path(item.path).create(value);
          }
        }
      }
    }
    return objects;
  }
  async fetchEntryObjects(): Promise<Record<string, any>> {
    if (existsSync(this.entry.path)) return await this.fetch(this.entry.path);
    return {};
  }
  async prepare(includeRouteFileObjects = true) {
    this.runtimeServer = await createServer({
      root: this.options.root,
      server: { middlewareMode: true },
      plugins: [
        tsconfigPlugin({}),
        {
          name: "dk:virtual-shaking",
          enforce: "pre",
          load: (id) => this.entry.tryLoad(id),
          transform(code, id) {
            return transformAndGenerate(
              code,
              { toSolidLink: true },
              ...getUrlTransforms(id),
            );
          },
          handleHotUpdate: async ({ file, read, modules }) => {
            return this.entry.tryUpdate(file, read, modules);
          },
        },
        solidPlugin({ ssr: true }),
      ],
    });
    this.runtime = await createViteRuntime(this.runtimeServer, {
      hmr: { logger: false },
    });
    this.entry.init();

    const objects = {
      ...(await this.fetchEntryObjects()),
      ...(includeRouteFileObjects && (await this.findRouteObjects())),
    };

    await this.app.add(objects);
  }

  async stop() {
    await this.runtimeServer?.close();
    await this.runtime?.destroy();
  }
}
