import { Route } from "./builders/RouteBuilder.js";
import { isRoute } from "./utils/kind.js";

export class App {
  readonly objects = new Map<string, any>();
  readonly routes = new Set<Route>();
  protected listeners = {
    add: new Set<(data: { id: string; value: unknown }) => any>(),
    remove: new Set<(data: { id: string; value: unknown }) => any>(),
    change: new Set<
      (data: { id: string; value: unknown; action: "add" | "remove" }) => any
    >(),
  };
  constructor() {}

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
  async remove(ids: string[]) {
    for (const id of ids) {
      const value = this.objects.get(id);
      if (!value) throw new Error(`Object not found: ${id}`);
      if (isRoute(value)) {
        this.routes.delete(value);
      }
      for (const cb of this.listeners.remove) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "remove" });
      this.objects.delete(id);
    }
  }
  async add(objects: Record<string, any>) {
    for (const [id, value] of Object.entries(objects)) {
      if (isRoute(value)) {
        this.routes.add(value);
      }
      this.objects.set(id, value);
      for (const cb of this.listeners.add) await cb({ id, value });
      for (const cb of this.listeners.change)
        await cb({ id, value, action: "add" });
    }
  }
}
