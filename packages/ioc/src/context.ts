import { IocClass, isIocClass, type UnsafeIocClass } from "./class.js";
import { IocFunc, isIocFunc, type UnsafeIocFunc } from "./func.js";
import {
  type InferIocParams,
  type IocParams,
  type IocParamsUserConfig,
  normalizeIocParams,
  isIocObject,
} from "./params.js";
import {
  IocRegistry,
  IocRegistryData,
  type IocRegistryKey,
  type IocRegistryValue,
} from "./registry.js";
import { iocKind, KindMap } from "./utils/kind.js";
import { capitalize } from "./utils/string.js";
import type { AbstractConstructor, Constructor } from "./utils/ts.js";
import { is } from "@dreamkit/kind";

export type IocContextOptions = {
  parentContainer?: IocContext;
  registry?: IocRegistry<IocContext>;
  onResolveIocObject?: (input: unknown) => boolean;
};

export type IocContextConstructor = Constructor<
  [IocContextOptions],
  IocContext
>;

export class IocError extends Error {}

const fallbackKey = Symbol("fallback");

export const undefinedValueKey = Symbol("undefined");
export const ignoreValueKey = Symbol("ignore");

type RequiredResolveOptions = { parent?: unknown; abstract?: boolean };
type OptionalResolveOptions = RequiredResolveOptions & { optional: true };
type ResolveOptions = RequiredResolveOptions & { optional?: boolean };

export class IocContext {
  static {
    iocKind(this, "IocContext");
  }
  readonly registry: IocRegistry<IocContext>;
  protected listeners: KindMap<IocRegistryKey, any[]>;
  constructor(readonly options: IocContextOptions = {}) {
    this.registry = this.options.registry ?? new IocRegistry();
    this.listeners = new KindMap();
  }
  protected getConstructor(): IocContextConstructor {
    return this.constructor as any;
  }
  registerSelf(): this {
    return this.register(IocContext, { value: this });
  }
  register<K extends IocRegistryKey>(
    key: K,
    data: IocRegistryValue<K, this>,
  ): this;
  register(items: IocRegistryData): this;
  register(value: unknown): this;
  register(...args: any[]): this {
    const set = (key: IocRegistryKey, data: IocRegistryValue) => {
      this.registry.set(key, data);
    };
    if (args.length === 2) {
      const [key, data] = args as [IocRegistryKey, IocRegistryValue];
      set(key, data);
    } else if (Array.isArray(args[0])) {
      const [items] = args as [IocRegistryData];
      for (const [key, data] of items) set(key, data);
    } else {
      const [value] = args as [unknown];
      const Constructor = (value as any).constructor;
      set(Constructor, { value });
    }
    return this;
  }
  unregister(key: IocRegistryKey) {
    this.registry.delete(key);
    return this;
  }
  registerFallback(data: IocRegistryValue<IocRegistryKey, this>): this {
    this.registry.set(fallbackKey, data as any);
    return this;
  }
  unregisterFallback(): this {
    this.registry.delete(fallbackKey);
    return this;
  }
  clear() {
    this.registry.clear();
  }
  clone(options: IocContextOptions = {}) {
    const Constructor = this.getConstructor();
    return new Constructor({
      registry: new IocRegistry(this.registry),
      ...options,
    });
  }
  fork(options: IocContextOptions = {}) {
    const Constructor = this.getConstructor();
    return new Constructor({
      parentContainer: this,
      ...options,
    });
  }
  resolveParamsFromObject<T extends UnsafeIocFunc | UnsafeIocClass>(
    input: T,
  ): InferIocParams<T> {
    if (!isIocClass(input) && !isIocFunc(input))
      throw new IocError(
        `The input is not derived from IocBase/IocFunc: ${input}`,
      );
    const $constructor = input as IocClass | IocFunc;
    const params = $constructor.$ioc.params;
    const registry = $constructor.$ioc.registry;
    return this.resolveParams(params, registry, input) as any;
  }
  resolveParams<T extends IocParamsUserConfig>(
    input: T,
    registry?: IocRegistryData,
    parent?: UnsafeIocFunc | UnsafeIocClass,
  ): IocParams<T> {
    const params: IocParams<T> = {} as any;
    const config = normalizeIocParams(input);
    const self = registry ? this.fork().register(registry) : this;
    for (const name in config) {
      const paramConfig = config[name];
      const registerKey = (
        "key" in paramConfig.options
          ? paramConfig.options.key
          : paramConfig.options.value
      ) as IocRegistryKey;
      const configurable = !!Object.keys(paramConfig.options.configurable || {})
        .length;
      if (configurable) {
        (params as any)[name] = (
          configurableParams: Record<string, unknown>,
        ) => {
          if (!isIocObject(registerKey))
            throw new Error(`Register key is not a IOC object`);
          const ctx = self.fork();
          for (const paramName in configurableParams) {
            const paramKey =
              registerKey.$ioc.params[paramName] ??
              registerKey.$ioc.params[capitalize(paramName)];
            if (!paramKey)
              throw new Error(`Configurable param key not found: ${paramName}`);
            const paramValue = configurableParams[paramName];
            ctx.register(paramKey, { value: paramValue });
          }
          return ctx.resolve(registerKey, {
            parent,
            optional: paramConfig.options.optional as true,
          });
        };
      } else {
        (params as any)[name] = self.resolve(registerKey, {
          parent,
          optional: paramConfig.options.optional as true,
        });
      }
    }
    return params;
  }
  protected getListeners(input: IocRegistryKey) {
    const value = this.listeners.get(input);
    if (value !== undefined) return value;
    for (const [key, listeners] of this.listeners.entries()) {
      if (is(input, key as any)) return listeners;
    }
  }
  protected get(input: IocRegistryKey) {
    const value = this.registry.get(input);
    if (value !== undefined) return value;
    for (const [key, value] of this.registry.entries()) {
      if ("is" in value && value.is) {
        if (value.is(input)) return value;
      } else if (is(input, key as any)) {
        return value;
      }
    }
  }
  findListeners(input: IocRegistryKey): ((value: any) => any)[] {
    let context: IocContext | undefined = this;
    const listeners: ((value: any) => any)[] = [];
    while (context) {
      let data = context.getListeners(input);
      if (data) listeners.push(...data);
      context = context.options.parentContainer;
    }
    return listeners;
  }
  find(
    input: IocRegistryKey,
  ): IocRegistryValue<IocRegistryKey, IocContext> | undefined {
    let context: IocContext | undefined = this;
    while (context) {
      let data = context.get(input);
      if (data === undefined) data = context.registry.get(fallbackKey);
      if (data !== undefined) return data;
      context = context.options.parentContainer;
    }
  }
  isRegistered(input: IocRegistryKey) {
    return !!this.find(input);
  }
  undef() {
    return undefinedValueKey;
  }
  protected resolveValue(
    input: IocRegistryKey,
    data: IocRegistryValue<IocRegistryKey, IocContext>,
    parent?: unknown,
  ): { value: unknown } | undefined {
    let value: any;
    const resolve =
      !data.onlyIf ||
      (typeof data.onlyIf === "function"
        ? data.onlyIf(this.fork().register(input, { value: ignoreValueKey }))
        : data.onlyIf.every((key) => this.find(key)));

    if (resolve) {
      if (data.value === ignoreValueKey) {
        return;
      } else if (data.value !== undefined) {
        return { value: data.value };
      } else if (data.useFactory) {
        value = data.useFactory(
          this.fork().register(input, { value: ignoreValueKey }),
          input,
          parent,
        );
      } else if (data.useClass) {
        value = this.fork()
          .register(input, { value: ignoreValueKey })
          .resolve(data.useClass, { parent });
      }
      if (value === ignoreValueKey) {
        return;
      } else if (value === undefinedValueKey) {
        return { value: undefined };
      } else if (value !== undefined) {
        if (data.value === undefined && data.singleton) data.value = value;
        return { value };
      }
    }
  }
  resolveKey(
    input: IocRegistryKey,
    parent?: unknown,
  ): { value: unknown } | undefined {
    const data = this.find(input);
    if (data !== undefined) {
      return this.resolveValue(input, data, parent);
    }
  }
  protected createKeyError(input: IocRegistryKey) {
    if (typeof input === "symbol") {
      return new IocError(`Symbol is not registered: ${input.toString()}`);
    } else if (typeof input === "function") {
      return new IocError(`Class is not registered: ${input.name}`);
    } else {
      return new IocError(`Unknown object is not registered: ${input}`);
    }
  }
  on<T extends AbstractConstructor>(
    constructor: T,
    listener: (value: InstanceType<T>) => void,
  ): this;
  on<T extends (...args: any[]) => any>(
    constructor: T,
    listener: (value: (...args: Parameters<T>) => ReturnType<T>) => void,
  ): this;
  on<T>(constructor: T, listener: (value: T) => void): this;
  on(key: IocRegistryKey, listener: (value: any) => void): this {
    const listeners = this.listeners.get(key);
    if (!listeners) this.listeners.set(key, []);
    this.listeners.get(key)!.push(listener);
    return this;
  }
  off(key: IocRegistryKey, listener?: (value: any) => any): this {
    if (!listener) {
      this.listeners.delete(key);
    } else {
      const listeners = this.listeners.get(key);
      const index = listeners?.indexOf(listener) ?? -1;
      if (listeners && index !== -1) listeners.splice(index, 1);
    }
    return this;
  }
  resolve<T extends AbstractConstructor>(
    constructor: T,
    options?: RequiredResolveOptions,
  ): InstanceType<T>;
  resolve<T extends AbstractConstructor>(
    constructor: T,
    options: OptionalResolveOptions,
  ): InstanceType<T> | undefined;
  resolve<T extends (...args: any[]) => any>(
    func: T,
    options?: RequiredResolveOptions,
  ): (...args: Parameters<T>) => ReturnType<T>;
  resolve<T extends (...args: any[]) => any>(
    func: T,
    options: OptionalResolveOptions,
  ): (...args: Parameters<T>) => ReturnType<T> | undefined;
  resolve<T = unknown>(
    key: Exclude<IocRegistryKey, Constructor>,
    options?: RequiredResolveOptions,
  ): T;
  resolve<T = unknown>(
    key: Exclude<IocRegistryKey, Constructor>,
    options: OptionalResolveOptions,
  ): T;
  resolve(
    input: Constructor | ((...args: any[]) => any) | IocRegistryKey,
    options: ResolveOptions = {},
  ) {
    const { onResolveIocObject } = this.options;
    const result = this.resolveKey(input as any, options.parent);
    if (result) {
      const listeners = this.findListeners(input as any);
      for (const listener of listeners) {
        const response = listener(result.value);
        if (response === undefinedValueKey) return;
        if (response !== undefined) return response;
      }
    }
    if (result) {
      return result.value;
    } else if (!options.abstract && isIocClass(input)) {
      if (!onResolveIocObject || onResolveIocObject(input)) {
        const params = this.resolveParamsFromObject(input);
        return new input(params);
      }
    } else if (!options.abstract && isIocFunc(input)) {
      if (!onResolveIocObject || onResolveIocObject(input)) {
        const params = this.resolveParamsFromObject(input);
        return input.bind(params as any);
      }
    } else if (!options.optional) {
      throw this.createKeyError(input as IocRegistryKey);
    }
  }
}

export const context = /*#__PURE__*/ new IocContext();
