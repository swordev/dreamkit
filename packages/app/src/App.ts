import { RequestUrl } from "./RequestUrl.js";
import { Route } from "./builders/RouteBuilder.js";
import { isMiddleware, MiddlewareConstructor } from "./objects/middleware.js";
import {
  AppService,
  isService,
  ServiceConstructor,
} from "./objects/service.js";
import { isRoute } from "./utils/kind.js";
import { log } from "./utils/log.js";
import { context, IocContext } from "@dreamkit/ioc";

export class App {
  static instanceKey = "dk:app";
  readonly started = false;
  readonly context: IocContext;
  readonly objects = new Map<string, any>();
  readonly routes = new Set<Route>();
  readonly services = new Set<AppService>();
  readonly middlewares = new Set<MiddlewareConstructor>();
  protected listeners = {
    add: new Set<(data: { id: string; value: unknown }) => any>(),
    remove: new Set<(data: { id: string; value: unknown }) => any>(),
    change: new Set<
      (data: { id: string; value: unknown; action: "add" | "remove" }) => any
    >(),
  };
  constructor() {
    this.context = context.fork().register(App, {
      value: this,
    });
  }
  static instance(): App {
    const value = (globalThis as any)[App.instanceKey];
    if (!value) throw new Error("App instance not found");
    return value;
  }
  static saveInstance(instance: App) {
    (globalThis as any)[App.instanceKey] = instance;
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
  async remove(ids: string[]) {
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
      }
      for (const cb of this.listeners.remove) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "remove" });
      this.objects.delete(id);
    }
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

  async add(objects: Record<string, any>) {
    const services: AppService[] = [];
    for (const [id, value] of Object.entries(objects)) {
      if (isRoute(value)) {
        this.routes.add(value);
      } else if (isService(value)) {
        const item = this.addService(value);
        services.push(item);
        this.services.add(item);
      } else if (isMiddleware(value)) {
        this.middlewares.add(value);
      }
      this.objects.set(id, value);
      for (const cb of this.listeners.add) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "add" });
    }
    if (this.started) {
      for (const service of services) await this.startService(service);
    }
  }

  createRequestContext(request: Request) {
    const url = new RequestUrl(request.url, "http://localhost");
    return this.context
      .fork()
      .register(Request, { value: request })
      .register(Headers, { value: request.headers })
      .register(RequestUrl, { value: url });
  }

  async request(request: Request): Promise<Response | undefined> {
    const context = this.createRequestContext(request);
    log("request", context.resolve(RequestUrl).pathname);
    for (const middleware of this.middlewares) {
      const $md = context.resolve(middleware);
      const response = await $md.onRequest();
      if (response) return response;
    }
  }
  async start() {
    log("starting app");
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
    if (errors.length) throw new AggregateError(errors, "App stop failed");
    (this as any).started = false;
  }
}
