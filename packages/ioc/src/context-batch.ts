import type { IocContext } from "./context.js";
import type {
  IocRegistryData,
  IocRegistryKey,
  IocRegistryValue,
} from "./registry.js";

export type IocContextBatchObject = {
  context: IocContext;
  unregister: () => void;
};

export class IocContextBatch {
  protected registry: Map<IocRegistryKey, IocRegistryValue> = new Map();
  constructor(protected context: IocContext) {}
  registerSelf(): IocContextBatch {
    return this.register(this.context["getConstructor"](), { value: this });
  }
  register<K extends IocRegistryKey>(
    key: K,
    data: IocRegistryValue<K, this>,
  ): IocContextBatch;
  register(items: IocRegistryData): IocContextBatch;
  register(value: unknown): IocContextBatch;
  register(...args: any[]): IocContextBatch {
    const input = this.context["parseRegisterInput"](args);
    for (const [key, data] of input) this.registry.set(key, data);
    return this;
  }
  end(): IocContextBatchObject["unregister"];
  end(object: true): IocContextBatchObject;
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
