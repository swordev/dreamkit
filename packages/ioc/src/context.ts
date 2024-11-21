import { isIocClass, type IocClass, type UnsafeIocClass } from "./class.js";
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
import { iocKind } from "./utils/kind.js";
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

type RequiredResolveOptions = { parent?: unknown };
type OptionalResolveOptions = RequiredResolveOptions & { optional: true };
type ResolveOptions = RequiredResolveOptions & { optional?: boolean };

export class IocContext {
  static {
    iocKind(this, "IocContext");
  }
  readonly registry: IocRegistry<IocContext>;
  constructor(readonly options: IocContextOptions = {}) {
    this.registry = this.options.registry ?? new IocRegistry();
  }
  protected getConstructor(): IocContextConstructor {
    return this.constructor as any;
  }
  register<K extends IocRegistryKey>(
    key: K,
    data: IocRegistryValue<K, this>,
  ): this;
  register(items: IocRegistryData): this;
  register(...args: any[]): this {
    if (args.length === 2) {
      const [key, data] = args as [IocRegistryKey, IocRegistryValue];
      this.registry.set(key, data);
    } else {
      const [items] = args as [IocRegistryData];
      for (const [key, data] of items) this.registry.set(key, data);
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
  protected $find(input: IocRegistryKey) {
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
  find(
    input: IocRegistryKey,
  ): IocRegistryValue<IocRegistryKey, IocContext> | undefined {
    let context: IocContext | undefined = this;
    while (context) {
      let data = context.$find(input);
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
      return result.value;
    } else if (isIocClass(input)) {
      if (!onResolveIocObject || onResolveIocObject(input)) {
        const params = this.resolveParamsFromObject(input);
        return new input(params);
      }
    } else if (isIocFunc(input)) {
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
