import { EJSON } from "./EJSON.js";
import { RequestUrl } from "./RequestUrl.js";
import { ResponseHeaders } from "./ResponseHeaders.js";
import { isApi } from "./builders/ApiBuilder.js";
import {
  isMiddleware,
  MiddlewareConstructor,
} from "./builders/MiddlewareBuilder.js";
import { Route } from "./builders/RouteBuilder.js";
import { Serializer } from "./builders/SerializerBuilder.js";
import {
  AppService,
  isService,
  ServiceConstructor,
} from "./builders/ServiceBuilder.js";
import { Session, SessionConstructor } from "./builders/SessionBuilder.js";
import { isSettings, SettingsConstructor } from "./builders/SettingsBuilder.js";
import { AppContext } from "./contexts/AppContext.js";
import { RequestContext } from "./contexts/RequestContext.js";
import {
  isSessionHandler,
  SessionHandler,
  SessionHandlerConstructor,
} from "./handlers/SessionHandler.js";
import {
  isSettingsHandler,
  SettingsHandler,
  SettingsHandlerConstructor,
} from "./handlers/SettingsHandler.js";
import { isRoute, kindApp } from "./utils/kind.js";
import { log } from "./utils/log.js";
import { type Func } from "@dreamkit/func";
import { getKinds, kindOf } from "@dreamkit/kind";
import { isPlainObject, merge } from "@dreamkit/utils/object.js";

export class App {
  static {
    kindApp(this);
  }
  static instanceKey = "dk:app";
  readonly started = false;
  readonly context: AppContext;
  readonly objects = new Map<string, any>();
  readonly routes = new Set<Route>();
  readonly services = new Set<AppService>();
  readonly middlewares = new Set<MiddlewareConstructor>();
  readonly settings = new Set<SettingsConstructor>();
  readonly api = new Map<string, Func>();
  readonly serializers = new Set<Serializer>();
  protected apiRef = new Map<string, string>();
  public settingsHandler: SettingsHandlerConstructor | undefined;
  public sessionHandler: SessionHandlerConstructor | undefined;
  protected listeners = {
    add: new Set<(data: { id: string; value: unknown }) => any>(),
    remove: new Set<(data: { id: string; value: unknown }) => any>(),
    change: new Set<
      (data: { id: string; value: unknown; action: "add" | "remove" }) => any
    >(),
  };
  constructor() {
    this.context = new AppContext().register(App, {
      value: this,
    });
    this.context.register(AppContext, { value: this.context });
  }
  static instance(): App {
    const value = (globalThis as any)[App.instanceKey];
    if (!value) throw new Error("App instance not found");
    return value;
  }
  static saveInstance(instance: App) {
    (globalThis as any)[App.instanceKey] = instance;
  }
  static createGlobalInstance(): App {
    const app = new App();
    this.saveInstance(app);
    return app;
  }
  on(
    event: "add" | "remove",
    cb: (data: { id: string; value: unknown }) => any,
  ): this;
  on(
    event: "change",
    cb: (data: { id: string; value: unknown; action: "add" | "remove" }) => any,
  ): this;
  on(event: keyof typeof this.listeners, cb: any): this {
    this.listeners[event].add(cb);
    return this;
  }
  off(event: "add" | "remove" | "change", cb: any): this {
    this.listeners[event].delete(cb);
    return this;
  }
  getObjectId(value: unknown) {
    for (const [id, subject] of this.objects) {
      if (subject === value) return id;
    }
    throw new Error("Object not found");
  }
  async remove(ids: string[]): Promise<void> {
    for (const id of ids) {
      const value = this.objects.get(id);
      if (!value) throw new Error(`Object not found: ${id}`);
      if (isRoute(value)) {
        this.routes.delete(value);
      } else if (isService(value)) {
        const item = [...this.services].find((item) => item.service === value);
        if (!item) throw new Error(`Service not found: ${id}`);
        await this.stopService(item);
      } else if (isMiddleware(value)) {
        this.middlewares.delete(value);
      } else if (isSettings(value)) {
        this.removeSettings(value);
      } else if (isSettingsHandler(value)) {
        this.context.unregister(SettingsHandler);
        this.settingsHandler = undefined;
      } else if (isSessionHandler(value)) {
        this.sessionHandler = undefined;
      } else if (isApi(value)) {
        const path = this.apiRef.get(id);
        this.apiRef.delete(id);
        if (path) this.api.delete(path);
      } else if (kindOf(value, Serializer)) {
        this.serializers.delete(value);
      }
      for (const cb of this.listeners.remove) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "remove" });
      this.objects.delete(id);
    }
  }
  async removeAll() {
    await this.stop();
    this.clear();
  }
  protected addService(service: ServiceConstructor): AppService {
    const item: AppService = {
      name: service.prototype.name ?? service.name ?? "anonymous",
      service,
      started: false,
    };
    this.services.add(item);
    return item;
  }

  protected async startService(item: AppService) {
    const name = item.name;
    log("starting service", { name });
    const cb = await this.context.resolve(item.service).onStart();
    const shutdown = typeof cb === "function";
    item.started = true;
    log("service started", { name, ...(shutdown && { shutdown: true }) });
    if (shutdown) item.shutdown = cb;
  }

  protected async stopService(item: AppService) {
    const name = item.name;
    log("stopping service", { name });
    await item.shutdown?.();
    item.started = false;
    log("service stopped", { name });
  }
  protected normalizeApiPath(path: string) {
    return (
      "/" +
      path
        .split(/[:/]/)
        .map((value) => {
          if (
            value === "index.ts" ||
            value === "index.js" ||
            value === "." ||
            !value.length
          ) {
            return undefined;
          } else if (value.endsWith(".ts") || value.endsWith(".js")) {
            const parts = value.split(".");
            return parts.slice(0, -1).join(".");
          } else {
            return value;
          }
        })
        .filter(Boolean)
        .join("/")
    );
  }

  protected onUnknownObject(id: string, value: unknown) {
    console.warn("Unknown object", { id, value, kinds: getKinds(value) });
  }

  protected resolveEntry(input: Record<string, any> | any[]) {
    const objects = Array.isArray(input)
      ? input.reduce(
          (result, value, index) => {
            result[index] = value;
            return result;
          },
          {} as Record<string, any>,
        )
      : { ...input };
    const entries = Object.entries(objects).flatMap(
      ([id, value]): [string, any][] => {
        if (isPlainObject(value) || Array.isArray(value)) {
          return Object.entries(this.resolveEntry(value)).map(
            ([childId, childValue]) => [
              id === "default" ? childId : `${id}:${childId}`,
              childValue,
            ],
          );
        }
        return [[id, value]];
      },
    );
    return Object.fromEntries(entries);
  }

  async add(input: Record<string, any> | any[]): Promise<void> {
    let loadSettingsHandler = false;
    const services: AppService[] = [];
    const settings: SettingsConstructor[] = [];
    const objects = this.resolveEntry(input);
    for (const [id, value] of Object.entries(objects)) {
      if (isRoute(value)) {
        this.routes.add(value);
      } else if (isService(value)) {
        const item = this.addService(value);
        services.push(item);
        this.services.add(item);
      } else if (isMiddleware(value)) {
        this.middlewares.add(value);
      } else if (isSettings(value)) {
        this.settings.add(value);
        settings.push(value);
      } else if (isSettingsHandler(value)) {
        loadSettingsHandler = true;
        this.settingsHandler = value;
        this.context.register(SettingsHandler, {
          singleton: true,
          useFactory: (context) => {
            const handler = context.resolve(value);
            handler["settings"] = this.settings;
            return handler;
          },
        });
      } else if (isSessionHandler(value)) {
        this.sessionHandler = value;
      } else if (isApi(value)) {
        const path = this.normalizeApiPath(id);
        this.api.set(path, value);
        this.apiRef.set(id, path);
      } else if (kindOf(value, Serializer)) {
        this.serializers.add(value);
      } else {
        this.onUnknownObject(id, value);
      }

      /*
      // [review] require create a dependency for removing
      
      if (is(value, IocBaseClass)) {
        const params = normalizeIocParams(value.$ioc.params);
        for (const key in params) {
          const { value } = params[key].options;
          if (isSettings(value)) {
            this.settings.add(value);
            settings.push(value);
          }
        }
      }*/

      this.objects.set(id, value);
      for (const cb of this.listeners.add) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "add" });
    }
    if (this.started) {
      if (loadSettingsHandler)
        await this.context.resolve(SettingsHandler, { abstract: true }).load();
      for (const setting of settings) await this.registerSettings(setting);
      for (const service of services) await this.startService(service);
    }
  }

  createRequestContext(request: Request): RequestContext {
    const context = new RequestContext({
      parentContainer: this.context,
    });
    const host = request.headers.get("host") ?? "localhost";
    const requestContext = context
      .register(RequestContext, { value: context })
      .register(EJSON, { value: new EJSON([...this.serializers]) })
      .register(Request, { value: request })
      .register(Headers, { value: request.headers })
      .register(ResponseHeaders, { value: new ResponseHeaders() })
      .register(RequestUrl, {
        value: new RequestUrl(request.url, `http://${host}`),
      })
      .register(Session, {
        useFactory: async (ctx, Session) => {
          const sessionHandler = ctx.resolve(SessionHandler);
          const data = await sessionHandler.get(Session as SessionConstructor);
          if (!data) return;
          return new (Session as SessionConstructor)(data);
        },
      });
    if (this.sessionHandler)
      requestContext.register(SessionHandler, {
        singleton: true,
        useClass: this.sessionHandler,
      });
    return requestContext;
  }

  async request(request: Request, context?: RequestContext): Promise<any> {
    if (!context) context = this.createRequestContext(request);
    log("request", context.resolve(RequestUrl).pathname);
    for (const middleware of this.middlewares) {
      const $md = context.resolve(middleware);
      const response = await $md.onRequest();
      if (response && response instanceof Response) {
        const headers = context.resolve(ResponseHeaders);
        for (const [name, value] of headers.entries()) {
          response.headers.set(name, value);
        }
      }
      return response;
    }
  }

  protected async initSettingsValue(constructor: SettingsConstructor) {
    const handler = this.context.resolve(SettingsHandler, {
      optional: true,
      abstract: true,
    });
    if (!handler) return;
    const options = constructor.options;
    let value = handler.get(constructor);
    if (options.optional && !options.generate && !value) return;
    let generated: Record<string, any> = {};
    if (options.generate) generated = options.generate(value || {}) || {};
    if (Object.keys(generated).length) {
      value = merge({ ...value }, generated);
      await handler.set(constructor, value);
    }
    return value;
  }

  protected async registerAllSettings() {
    const settingsHandler = this.resolveSettingsHandler();
    if (settingsHandler) {
      try {
        settingsHandler.autoSave = false;
        await settingsHandler.load();
        for (const st of this.settings) await this.registerSettings(st);
      } finally {
        settingsHandler.autoSave = true;
      }
    }
  }

  protected async registerSettings(constructor: SettingsConstructor) {
    const options = constructor.options;
    const value = await this.initSettingsValue(constructor);
    if (options.optional && !value) return;
    log("registering settings", { name: options.name });
    this.context.register(constructor, {
      value: new constructor(value as any),
    });
  }

  protected removeSettings(constructor: SettingsConstructor) {
    this.settings.delete(constructor);
    this.context.unregister(constructor);
  }

  protected resolveSettingsHandler(): SettingsHandler | undefined {
    return this.context.resolve(SettingsHandler, {
      optional: true,
      abstract: true,
    });
  }
  protected async prepare() {
    await this.registerAllSettings();
    const settingsHandler = await this.resolveSettingsHandler()?.save();
    return { settingsHandler };
  }
  async start() {
    log("starting app");
    if (this.started) throw new Error("App is already started");
    await this.prepare();
    (this as any).started = true;
    for (const item of this.services) await this.startService(item);
  }

  async stop() {
    const errors: Error[] = [];
    const services = [...this.services].filter(
      (item) => item.started && typeof item.shutdown === "function",
    );
    log("stopping services", { services: services.length });
    for (const item of services) {
      try {
        await this.stopService(item);
      } catch (error) {
        log("service stopped", { name, error });
        errors.push(error as Error);
      }
    }
    for (const settings of this.settings) this.removeSettings(settings);
    if (errors.length) throw new AggregateError(errors, "App stop failed");
    (this as any).started = false;
  }
  clear() {
    this.objects.clear();
    this.routes.clear();
    this.services.clear();
    this.middlewares.clear();
    this.settings.clear();
    this.api.clear();
    this.apiRef.clear();
    this.settingsHandler = undefined;
    this.sessionHandler = undefined;
  }
}
