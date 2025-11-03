import {
  attachIocMeta,
  isIocObject,
  type IocParams,
  type IocParamsConfig,
  type IocParamsUserConfig,
} from "./params.js";
import type { IocRegistryData } from "./registry.js";

export type IocFunc<
  P extends IocParamsUserConfig = IocParamsUserConfig,
  A extends any[] = any[],
  R = any,
> = {
  (this: IocParams<P>, ...args: A): R;
  $ioc: { params: IocParamsConfig; registry?: IocRegistryData };
};

export type UnsafeIocFunc = {
  (this: any, ...args: any): any;
  $ioc: { params: IocParamsConfig; registry?: IocRegistryData };
};

export function IocFunc<P extends IocParamsUserConfig>(
  params: P = {} as P,
  registry?: IocRegistryData,
) {
  return <V extends (this: IocParams<P>, ...args: any[]) => any>(func: V): V =>
    attachIocMeta(func, params, registry, "func");
}

export function isIocFunc(input: unknown): input is IocFunc<any> {
  return isIocObject(input) && input.$iocType === "func";
}
