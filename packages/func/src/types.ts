import type { Any, Merge, TryPick } from "./utils/ts.js";
import type {
  IocBind,
  IocContext,
  IocParams,
  IocParamsUserConfig,
  IocRegistryData,
  IocRegistryKey,
} from "@dreamkit/ioc";
import type {
  ExactType,
  InferType,
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
} from "@dreamkit/schema";

export type FuncParams = MinimalObjectType | undefined;
export type FuncSelf = IocParamsUserConfig | undefined;
export type FuncTitle = string | undefined;

export type FuncData<
  TParams extends FuncParams = FuncParams,
  TSelf extends FuncSelf = FuncSelf,
  TTitle extends FuncTitle = FuncTitle,
> = {
  params?: TParams;
  self?: TSelf;
  title?: TTitle;
};

export type FuncOptions<T extends FuncData = FuncData> = T & {
  register?: IocRegistryData;
  context?: (options: FuncOptions) => IocContext;
  onCreate?: (func: Func) => Func;
  onCall?: (
    options: FuncCallOptions,
    data: {
      context: IocContext;
      callback: (this: any, params: any) => any;
      params: Record<string, any>;
    },
  ) => any;
  cache?: { key?: string };
  static?: Record<string, any>;
};

export type MergeFuncData<
  D1 extends FuncData,
  D2 extends Partial<FuncData>,
> = Merge<FuncData, D1, D2>;

export type InferFuncParams<A extends FuncParams | ObjectTypeProps> =
  A extends MinimalObjectType
    ? InferType<A>
    : A extends ObjectTypeProps
      ? InferType<MinimalObjectType<A>>
      : undefined;

export type ResolveParamsType<A extends FuncParams | ObjectTypeProps> =
  A extends MinimalObjectType
    ? A
    : A extends ObjectTypeProps
      ? ObjectType<A>
      : undefined;

export type FuncMeta<T extends FuncData = FuncData, R = any> = {
  readonly params: TryPick<TryPick<T, "params">, "props">;
  readonly $self: TryPick<T, "self", {}>;
  readonly title: TryPick<T, "title">;
  $clone: () => Func;
  $options: FuncOptions<T>;
  bind: IocBind<
    unknown extends Any<T>
      ? any
      : [T["self"]] extends [undefined]
        ? void
        : keyof T["self"] extends never
          ? void
          : IocParams<T["self"]>,
    FuncBody<{ params: T["params"] }, R>
  >;
};

export type FuncCallOptions<
  A extends FuncParams = FuncParams,
  S extends FuncSelf = any,
> = {
  self: (unknown extends Any<S> ? any : IocParams<S>) | IocContext;
  with?: [IocRegistryKey, any][];
} & (unknown extends Any<A>
  ? { params: any }
  : A extends undefined
    ? { params?: undefined }
    : { params: InferFuncParams<A> });

export type ResolveFuncParams<T extends FuncData> =
  undefined extends T["params"] ? [] : [InferFuncParams<T["params"]>];

export type ResolveFuncBody<T extends FuncData, R> = (
  ...data: ResolveFuncParams<T>
) => R;

export type FuncBody<T extends FuncData, R> = <
  I extends InferFuncParams<T["params"]>,
>(
  this: [T["self"]] extends [undefined]
    ? void
    : keyof T["self"] extends never
      ? void
      : IocParams<T["self"]>,
  ...data: undefined extends T["params"]
    ? []
    : [params: ExactType<T["params"] & {}, I> & {}]
) => R;

export type Func<T extends FuncData = FuncData, R = any> = FuncBody<T, R> &
  FuncMeta<T, R>;

export type ResolveFunc<F extends Func<any, any>, Meta = true> =
  F extends Func<infer T, infer R>
    ? ResolveFuncBody<T, R> & ([Meta] extends [true] ? FuncMeta<T, R> : {})
    : never;

export {};
