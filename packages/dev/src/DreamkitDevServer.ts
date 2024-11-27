import {
  dreamkitPluginOptions,
  DreamkitPluginOptions,
  OutDreamkitPluginOptions,
} from "./options.js";
import { log } from "./utils/log.js";
import { getExt, resolvePath } from "./utils/path.js";
import { findFileRoutes } from "./utils/router.js";
import { VirtualShaking } from "./utils/shaking.js";
import {
  createTransformUrl,
  getUrlTransforms,
  transformAndGenerate,
} from "./utils/transform.js";
import { App, isRoute, Route, $route, SettingsHandler } from "@dreamkit/app";
import { is } from "@dreamkit/kind";
import {
  NodeSettingsHandler,
  NodeSettingsHandlerOptions,
} from "@dreamkit/node-app";
import { FSWatcher, watch } from "chokidar";
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
  static instanceKey = "dk:dev-server";
  readonly app: App;
  readonly entry: VirtualShaking;
  protected runtimeServer: ViteDevServer | undefined;
  protected runtime: ViteRuntime | undefined;
  protected settingsFileWatcher: FSWatcher | undefined;
  readonly options: DreamkitDevOptions;
  constructor(inOptions: DreamkitDevInOptions) {
    this.app = new App();
    const options = (this.options = {
      ...dreamkitPluginOptions,
      ...inOptions,
    });
    const vars = { defaults: options.root, root: options.root };
    options.entry = resolvePath(options.entry, vars);
    options.settingsPath = resolvePath(options.settingsPath, vars);
    options.metaGlobalOutput = resolvePath(options.metaGlobalOutput, vars);
    options.metaLocalOutput = resolvePath(options.metaLocalOutput, vars);
    options.presets = options.presets?.map((v) => resolvePath(v, vars));

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
  static instance(): DreamkitDevServer {
    const value = (globalThis as any)[DreamkitDevServer.instanceKey];
    if (!value) throw new Error("DreamkitDevServer instance not found");
    return value;
  }
  static saveInstance(instance: DreamkitDevServer) {
    (globalThis as any)[DreamkitDevServer.instanceKey] = instance;
  }
  async fetch(path: string) {
    //const mod = $server.moduleGraph.getModuleById(shaking.entry);
    //if (mod) $server.moduleGraph.invalidateModule(mod);
    try {
      const ext = getExt(path);
      return await this.runtime!.executeUrl(`${path}?${Date.now()}&ext=${ext}`);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
  async fetchDefault<T>(path: string): Promise<T> {
    const result = await this.fetch(path);
    return result?.default;
  }
  async fetchRoute(path: string): Promise<Route> {
    const url = createTransformUrl(path, { toSolidRoute: true });
    return await this.fetchDefault(url);
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
                  filePath: item.filePath.replaceAll("\\", "/"),
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
    for (const path of this.options.presets || [])
      await this.app.add(await this.fetch(path));
    await this.app.add({
      ...(await this.fetchEntryObjects()),
      ...(includeRouteFileObjects && (await this.findRouteObjects())),
    });

    if (is(this.app.settingsHandler, NodeSettingsHandler)) {
      this.app.context.register(NodeSettingsHandlerOptions, {
        value: new NodeSettingsHandlerOptions({
          path: this.options.settingsPath,
        }),
      });
      this.settingsFileWatcher = watch(this.options.settingsPath, {
        ignoreInitial: false,
      }).on("all", async () => {
        log("settings file changed");
        await this.app.context.resolve(SettingsHandler).load();
      });
    }
  }
  async start() {
    await this.app.start();
  }
  async stop() {
    if (this.app.started) await this.app.stop();
    await this.settingsFileWatcher?.close();
    await this.runtimeServer?.close();
    await this.runtime?.destroy();
  }
}
