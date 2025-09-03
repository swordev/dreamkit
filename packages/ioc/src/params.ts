import { IocFunc } from "./func.js";
import type { IocRegistryData, IocRegistryKey } from "./registry.js";
import { iocKind } from "./utils/kind.js";
import { uncapitalize } from "./utils/string.js";
import type {
  AbstractConstructor,
  Merge,
  TryUncapitalize,
} from "./utils/ts.js";
import { kindOf } from "@dreamkit/kind";

export type ParamValue =
  | (abstract new (...args: any[]) => any)
  | ((...args: any[]) => any);

export type IocParamValue = ParamValue & {
  $ioc: { params: IocParamsUserConfig };
};

export type IocParamsConfig = Record<string, IocParamBuilder>;
export type IocParamsUserConfig = Record<string, IocParamBuilder | ParamValue>;

export type IocParamConfigurable<V extends ParamValue> = V extends IocParamValue
  ? {
      [K in keyof V["$ioc"]["params"] as TryUncapitalize<K>]?: true;
    }
  : {};

export type IocParamData<
  V extends ParamValue = ParamValue,
  C extends IocParamConfigurable<V> = IocParamConfigurable<V>,
  O extends boolean = boolean,
> = {
  value: V;
  optional?: O;
  configurable?: C;
};

export type IocParamOptions<T extends IocParamData = IocParamData> = T & {
  key?: IocRegistryKey;
};

export type MergeIocParamData<
  D1 extends IocParamData,
  D2 extends Partial<IocParamData>,
> = Merge<IocParamData, D1, D2>;

export type InferIocParams<
  C extends AbstractConstructor | IocFunc,
  TOmit extends string | number | symbol = never,
> = Omit<
  C extends AbstractConstructor ? ConstructorParameters<C>[0] : ThisType<C>,
  TOmit
>;

type IocParamConfigurableFunc<T, K extends keyof T> =
  T[K] extends IocParamBuilder<infer D>
    ? keyof D["configurable"] extends never
      ? IocParam<D["value"]>
      : (params: IocParamConfigurableFuncParams<D>) => IocParam<D["value"]>
    : IocParam<T[K]>;

type IocParamConfigurableFuncParams<T extends IocParamData> =
  T["value"] extends IocParamValue
    ? {
        [K in keyof T["value"]["$ioc"]["params"] as TryUncapitalize<K> extends keyof NonNullable<
          T["configurable"]
        >
          ? TryUncapitalize<K>
          : never]: K extends keyof T["value"]["$ioc"]["params"]
          ? IocParamConfigurableFunc<T["value"]["$ioc"]["params"], K>
          : never;
      }
    : {};

export type ResolveIocParamOptional<T extends IocParamBuilder> =
  "optional" extends keyof T["options"]
    ? [true] extends [T["options"]["optional"]]
      ? undefined
      : never
    : never;

export type ResolveIocParamVal<T extends IocParamBuilder> =
  "configurable" extends keyof T["options"]
    ? keyof T["options"]["configurable"] extends never
      ? IocParam<T["options"]["value"]>
      : (
          params: IocParamConfigurableFuncParams<T["options"]>,
        ) => IocParam<T["options"]["value"]>
    : IocParam<T["options"]["value"]>;

export type ResolveIocParamValue<T> = T extends IocParamBuilder
  ? ResolveIocParamVal<T> | ResolveIocParamOptional<T>
  : IocParam<T>;

type PickOptionalParamsConfig<T> = {
  [K in keyof T as T[K] extends IocParamBuilder
    ? ResolveIocParamOptional<T[K]> extends never
      ? never
      : K
    : never]: T[K];
};

type PickRequiredParamsConfig<T> = Omit<T, keyof PickOptionalParamsConfig<T>>;

/**
 * https://github.com/microsoft/TypeScript/issues/41165
 * https://github.com/microsoft/TypeScript/issues/23216
 * https://github.com/microsoft/TypeScript/issues/44643
 */

export type IocParams<P> = {
  readonly [K in keyof PickRequiredParamsConfig<P> as TryUncapitalize<K>]: ResolveIocParamValue<
    P[K]
  >;
} & {
  readonly [K in keyof PickOptionalParamsConfig<P> as TryUncapitalize<K>]?: ResolveIocParamValue<
    P[K]
  >;
};

export type IocParam<V> = V extends NumberConstructor
  ? number
  : V extends StringConstructor
    ? string
    : V extends BooleanConstructor
      ? boolean
      : V extends AbstractConstructor<any, infer I>
        ? I
        : V extends (...args: any[]) => any
          ? V extends { bind: IocBind }
            ? ReturnType<V["bind"]>
            : (...args: Parameters<V>) => ReturnType<V>
          : V;

export type IocBind<S = any, R = any> = {
  (input: S): R;
  $iocBind: true;
};

export class IocParamBuilder<T extends IocParamData = IocParamData> {
  static {
    iocKind(this, "IocParamBuilder");
  }
  constructor(readonly options: IocParamOptions<T>) {}
  protected clone(options: Partial<IocParamOptions>) {
    return new IocParamBuilder({
      ...this.options,
      ...options,
    });
  }
  protected getKey(): IocRegistryKey {
    return (
      "key" in this.options ? this.options.key : this.options.value
    ) as IocRegistryKey;
  }
  protected isConfigurable(): boolean {
    for (const _ in this.options.configurable) return true;
    return false;
  }
  key(value: IocRegistryKey): this {
    return this.clone({ key: value }) as any;
  }
  optional(): IocParamBuilder<MergeIocParamData<T, { optional: true }>> {
    return this.clone({ optional: true }) as any;
  }
  configurable: T["value"] extends IocParamValue
    ? <C extends IocParamConfigurable<T["value"]>>(
        input: C,
      ) => IocParamBuilder<MergeIocParamData<T, { configurable: C }>>
    : never = function (input: any) {
    // @ts-ignore
    const self = this;
    return self.clone({ configurable: input }) as any;
  } as any;
}

export function iocParam<V extends ParamValue>(
  value: V,
): IocParamBuilder<{ value: V }> {
  return new IocParamBuilder({ value });
}

export function normalizeIocParams(
  input: IocParamsUserConfig,
): IocParamsConfig {
  const params: IocParamsConfig = {};
  for (const key in input) {
    const value = input[key];
    params[uncapitalize(key)] = kindOf(value, IocParamBuilder)
      ? value
      : iocParam(value);
  }
  return params;
}

export function assignParams(
  params: Record<string, any>,
  self: Record<string, unknown>,
) {
  for (const name in params) {
    self[name] = params[name as keyof typeof params];
  }
}

export function attachIocMeta(
  object: object,
  params: IocParamsUserConfig,
  registry: IocRegistryData | undefined,
  type: "func" | "class",
): any {
  return Object.assign(object, {
    $ioc: { params, registry },
    $iocType: type,
  });
}
export function isIocObject(
  input: unknown,
): input is { $ioc: { params: any; registry: any }; $iocType: string } {
  return (
    !!input &&
    typeof input === "function" &&
    "$ioc" in input &&
    "$iocType" in input
  );
}
