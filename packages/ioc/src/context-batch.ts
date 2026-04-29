import type { IocContext } from "./context.js";
import type {
  IocRegistryData,
  IocRegistryKey,
  IocRegistryValue,
} from "./registry.js";

export type IocContextBatchObject<T extends IocContext = IocContext> = {
  context: T;
  unregister: () => void;
};

export class IocContextBatch<T extends IocContext = IocContext> {
  protected registry: Map<IocRegistryKey, IocRegistryValue> = new Map();
  constructor(protected context: T) {}
  registerSelf(): IocContextBatch<T> {
    return this.register(this.context["getConstructor"](), { value: this });
  }
  register<K extends IocRegistryKey>(
    key: K,
    data: IocRegistryValue<K, T>,
  ): IocContextBatch<T>;
  register(items: IocRegistryData): IocContextBatch<T>;
  register(value: unknown): IocContextBatch<T>;
  register(...args: any[]): IocContextBatch<T> {
    const input = this.context["parseRegisterInput"](args);
    for (const [key, data] of input) this.registry.set(key, data);
    return this;
  }
  end(): IocContextBatchObject["unregister"];
  end(object: true): IocContextBatchObject<T>;
  end(
    object?: boolean,
  ): IocContextBatchObject | IocContextBatchObject["unregister"] {
    const { context } = this;
    const entries = [...this.registry.entries()];
    for (const [key, data] of entries) this.context.registry.set(key, data);
    const unregister = () => {
      for (const [key] of entries) this.context.unregister(key);
    };

    return object ? { context, unregister } : unregister;
  }
}
