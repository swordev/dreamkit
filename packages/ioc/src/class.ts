import {
  IocParams,
  IocParamsUserConfig,
  assignParams,
  attachIocMeta,
  isIocObject,
} from "./params.js";
import { IocRegistryData } from "./registry.js";
import { iocKind } from "./utils/kind.js";
import { capitalize } from "./utils/string.js";
import {
  AbstractConstructor,
  ConstructorArg,
  ObjectToArray,
  TryUncapitalize,
} from "./utils/ts.js";
import { is } from "@dreamkit/kind";

export type UnsafeIocClass = {
  new (params: any): any;
  $ioc: { params: IocParamsUserConfig; registry?: IocRegistryData };
};

export class IocBaseClass<P extends IocParamsUserConfig = {}> {
  static $ioc: { params: IocParamsUserConfig };
  static {
    iocKind(this, "IocBaseClass");
  }
  constructor(params: IocParams<P>) {
    assignParams(params, this as any);
  }
}

export type MinimalIocClass<P extends IocParamsUserConfig = {}> = {
  new (...args: any[]): any;
  $ioc: { params: P };
};

export type IocClass<
  P extends IocParamsUserConfig = {},
  I = InstanceType<typeof IocBaseClass>,
  E extends string | number | symbol = never,
  Params = IocParams<P>,
> = {
  new (
    ...args: ObjectToArray<{
      [K in keyof Params as K extends E ? never : K]: Params[K];
    }>
  ): I & Params;
  $ioc: {
    params: {
      [K in keyof P as K extends E
        ? never
        : TryUncapitalize<K> extends E
          ? never
          : K]: P[K];
    };
    registry?: IocRegistryData;
  };
};

export type InferParamsUserConfig<
  T extends { $ioc: { params: IocParamsUserConfig } },
  E = never,
> = {
  [K in keyof T["$ioc"]["params"] as TryUncapitalize<K> extends E
    ? never
    : K]: T["$ioc"]["params"][K];
};

export function IocClass(): IocClass;
export function IocClass<P extends IocParamsUserConfig>(params: P): IocClass<P>;
export function IocClass<C extends AbstractConstructor>(
  constructor: C,
): IocClass<ConstructorArg<C>, InstanceType<C>>;
export function IocClass<
  C extends MinimalIocClass<any>,
  P extends Partial<ConstructorArg<C>>,
>(
  constructor: C,
  params: P,
): IocClass<InferParamsUserConfig<C>, InstanceType<C>, keyof P>;
export function IocClass<
  C extends AbstractConstructor,
  P extends IocParamsUserConfig,
>(constructor: C & { $ioc?: never }, config: P): IocClass<P, InstanceType<C>>;
export function IocClass(...args: any[]): any {
  let constructor: AbstractConstructor | undefined;
  let params: Record<string, any> = {};
  if (args.length === 1) {
    const [input] = args as [AbstractConstructor | Record<string, any>];
    if (typeof input === "function") {
      constructor = input as any;
    } else {
      params = input;
    }
  } else if (args.length > 1) {
    [constructor, params] = args;
  }

  let paramsConfig: IocParamsUserConfig;
  let CustomIocClass: AbstractConstructor;

  if (!constructor) {
    paramsConfig = params;
    CustomIocClass = class extends IocBaseClass {};
  } else if (is(constructor, IocBaseClass)) {
    paramsConfig = { ...constructor.$ioc.params };
    for (const key in params) {
      delete paramsConfig[key];
      delete paramsConfig[capitalize(key)];
    }
    CustomIocClass = class extends constructor {
      constructor($params: Record<string, any>) {
        super({ ...$params, ...params });
      }
    };
  } else {
    paramsConfig = params;
    CustomIocClass = class extends constructor {
      constructor(params: Record<string, any>) {
        super();
        assignParams(params, this);
      }
    };
    iocKind(CustomIocClass, "IocBaseClass");
  }
  iocKind(CustomIocClass, "IocClass");
  return attachIocMeta(CustomIocClass, paramsConfig, undefined, "class");
}

export function createIocClass<C extends AbstractConstructor>(
  constructor: C,
): <P extends IocParamsUserConfig = {}>(
  params: P,
) => IocClass<P, InstanceType<C>> {
  return (params) => IocClass(constructor, params);
}

export function isIocClass(input: unknown): input is IocClass<any> {
  return isIocObject(input) && input.$iocType === "class";
}
