import { IocClass, isIocClass } from "./class.js";
import { createKeyError, IocError } from "./error.js";
import { IocFunc, isIocFunc } from "./func.js";
import {
  normalizeIocParams,
  isIocObject,
  IocParamBuilder,
  type IocParamsConfig,
  type IocParamsUserConfig,
  type IocParams,
} from "./params.js";
import {
  IocRegistry,
  IocRegistryData,
  type IocRegistryKey,
  type IocRegistryValue,
} from "./registry.js";
import { ensureSync } from "./utils/async.js";
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
  protected createParam(
    param: IocParamBuilder,
    options: {
      parent?: unknown;
      context?: IocContext;
      async?: boolean;
    } = {},
  ) {
    const { parent } = options;
    const context = options.context ?? this;
    return param["isConfigurable"]()
      ? this.createConfigurableParam(param, { parent, context })
      : context.dynamicResolve(
          param["getKey"](),
          { parent, optional: param.options.optional },
          { async: options.async },
        );
  }
  protected createConfigurableParam(
    param: IocParamBuilder,
    options: {
      context: IocContext;
      parent?: unknown;
    },
  ) {
    const registerKey = param["getKey"]();
    return (configurableParams: Record<string, unknown>) => {
      if (!isIocObject(registerKey))
        throw new IocError(`Register key is not a IOC object`);
      const ctx = options.context.fork();
      for (const paramName in configurableParams) {
        const paramKey =
          registerKey.$ioc.params[paramName] ??
          registerKey.$ioc.params[capitalize(paramName)];
        if (!paramKey)
          throw new IocError(`Configurable param key not found: ${paramName}`);
        const paramValue = configurableParams[paramName];
        ctx.register(paramKey, { value: paramValue });
      }
      return ensureSync(
        ctx.resolve(registerKey, {
          parent: options.parent,
          optional: param.options.optional as true,
        }),
      );
    };
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

  protected shouldBeResolved(
    input: any,
    key: IocRegistryValue<IocRegistryKey, IocContext>,
  ) {
    return (
      !key.onlyIf ||
      (typeof key.onlyIf === "function"
        ? key.onlyIf(this.fork().register(input, { value: ignoreValueKey }))
        : key.onlyIf.every((key) => this.find(key)))
    );
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
  protected callListeners(key: any, value: any) {
    const listeners = this.findListeners(key);
    for (const listener of listeners) {
      const response = listener(value);
      if (response === undefinedValueKey) return;
      if (response !== undefined) return response;
    }
    return value;
  }

  protected resolveWithRegistryData(
    input: any,
    data: IocRegistryValue,
    options: {
      parent?: any;
      async?: boolean;
    },
  ) {
    const { parent } = options;
    if (data.value !== undefined) {
      return data.value;
    } else if (data.useFactory) {
      return data.useFactory(
        this.fork().register(input, { value: ignoreValueKey }),
        input as any,
        parent,
      );
    } else if (data.useClass) {
      const ctx = this.fork().register(input as any, { value: ignoreValueKey });
      return ctx.dynamicResolve(
        data.useClass,
        { parent },
        { async: options.async },
      );
    }
  }

  protected tryParseResolvedValue(
    input: any,
    key: IocRegistryValue,
    value: unknown,
  ) {
    if (value === ignoreValueKey) {
      return { value: undefined };
    } else if (value === undefinedValueKey) {
      return { value: this.callListeners(input, undefined) };
    } else if (value !== undefined) {
      if (key.value === undefined && key.singleton) key.value = value;
      return { value: this.callListeners(input, value) };
    }
  }

  protected tryParseIocObject(
    input: unknown,
    options: ResolveOptions = {},
  ):
    | {
        params: IocParamsConfig;
        paramOptions: { context: IocContext; parent: unknown };
        create: (params: Record<string, any>) => any;
      }
    | undefined {
    let iocObject!: IocClass | IocFunc;
    let create!: (params: any) => any;

    if (!options.abstract && isIocClass(input)) {
      iocObject = input;
      create = (params: any) => new input(params);
    } else if (!options.abstract && isIocFunc(input)) {
      iocObject = input;
      create = (params: any) => input.bind(params);
    } else if (!options.optional) {
      throw createKeyError(input as IocRegistryKey);
    } else {
      return;
    }

    const { onResolveIocObject } = this.options;
    const context = iocObject.$ioc.registry
      ? this.fork().register(iocObject.$ioc.registry)
      : this;
    if (!onResolveIocObject || onResolveIocObject(input)) {
      return {
        paramOptions: { context, parent: input },
        params: normalizeIocParams(iocObject.$ioc.params),
        create,
      };
    }
  }

  protected dynamicResolve(
    input: IocRegistryKey,
    options: ResolveOptions = {},
    dynamicOptions: {
      async?: boolean;
    } = {},
  ) {
    return dynamicOptions.async
      ? this.resolveAsync(input, options)
      : this.resolve(input, options);
  }
  resolveParams<T extends IocParamsUserConfig>(input: T): IocParams<T> {
    const config = normalizeIocParams(input);
    const params: Record<string, any> = {};
    for (const name in config) {
      params[name] = ensureSync(this.createParam(config[name]));
    }
    return params as any;
  }

  async resolveAsyncParams<T extends IocParamsUserConfig>(
    input: T,
  ): Promise<IocParams<T>> {
    const config = normalizeIocParams(input);
    const params: Record<string, any> = {};
    for (const name in config) {
      params[name] = await this.createParam(config[name]);
    }
    return params as any;
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
    const data = this.find(input as any);

    if (data && this.shouldBeResolved(input, data)) {
      const value = ensureSync(
        this.resolveWithRegistryData(input, data, { parent: options.parent }),
      );
      const result = this.tryParseResolvedValue(input, data, value);
      if (result) return result.value;
    }

    const object = this.tryParseIocObject(input, options);

    if (object) {
      const params: Record<string, any> = {};
      for (const name in object.params) {
        params[name] = ensureSync(
          this.createParam(object.params[name], object.paramOptions),
        );
      }
      return object.create(params);
    }
  }
  resolveAsync<T extends AbstractConstructor>(
    constructor: T,
    options?: RequiredResolveOptions,
  ): Promise<InstanceType<T>>;
  resolveAsync<T extends AbstractConstructor>(
    constructor: T,
    options: OptionalResolveOptions,
  ): Promise<InstanceType<T> | undefined>;
  resolveAsync<T extends (...args: any[]) => any>(
    func: T,
    options?: RequiredResolveOptions,
  ): Promise<(...args: Parameters<T>) => ReturnType<T>>;
  resolveAsync<T extends (...args: any[]) => any>(
    func: T,
    options: OptionalResolveOptions,
  ): Promise<(...args: Parameters<T>) => ReturnType<T> | undefined>;
  resolveAsync<T = unknown>(
    key: Exclude<IocRegistryKey, Constructor>,
    options?: RequiredResolveOptions,
  ): Promise<T>;
  resolveAsync<T = unknown>(
    key: Exclude<IocRegistryKey, Constructor>,
    options: OptionalResolveOptions,
  ): Promise<T>;
  async resolveAsync(
    input: Constructor | ((...args: any[]) => any) | IocRegistryKey,
    options: ResolveOptions = {},
  ) {
    const data = this.find(input as any);

    if (data && this.shouldBeResolved(input, data)) {
      const value = await this.resolveWithRegistryData(input, data, {
        parent: options.parent,
        async: true,
      });
      const result = this.tryParseResolvedValue(input, data, value);
      if (result) return result.value;
    }

    const object = this.tryParseIocObject(input, options);

    if (object) {
      const params: Record<string, any> = {};
      for (const name in object.params) {
        params[name] = await this.createParam(object.params[name], {
          ...object.paramOptions,
          async: true,
        });
      }
      return object.create(params);
    }
  }
}

export const context = /*#__PURE__*/ new IocContext();
