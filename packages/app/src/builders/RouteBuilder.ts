import { isRouteBuilder, kindRoute, kindRouteBuilder } from "../utils/kind.js";
import { Func } from "@dreamkit/func";
import { kindOf } from "@dreamkit/kind";
import {
  InferType,
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
  s,
  type Type,
} from "@dreamkit/schema";
import type { Merge } from "@dreamkit/utils/ts.js";

export type RoutePathParams<P extends string | number | symbol> = {
  [K in P]: K extends string ? `:${K}` : never;
};

export type RouteParams = MinimalObjectType | undefined;
export type RouteApi = { [key: string]: (...args: any[]) => any };
export type ResolveRouteApi<T extends RouteData> = keyof T["api"] extends never
  ? never
  : {
      [K in keyof T["api"]]: T["api"][K] extends Func<
        infer TData,
        infer TResult
      >
        ? Func<
            {
              [K in keyof TData as K extends "self" ? never : K]: TData[K];
            },
            Promise<Awaited<TResult>>
          >
        : never;
    };

export type RoutePreloadData<T extends RouteData> = {
  intent: string;
  params: InferRouteParams<T>;
  api: ResolveRouteApi<T>;
};
export type RouteData<
  TParams extends RouteParams = RouteParams,
  TApi extends RouteApi = RouteApi,
  TData extends unknown = unknown,
> = {
  params?: TParams;
  api?: TApi;
  _data?: TData;
};

export type RouteOptions<T extends RouteData = RouteData> = T & {
  title?: string;
  path?: string;
  onParamsError?: { value: InferRouteParams<T> } | { redirect: string };
  preload?: (data: RoutePreloadData<T>) => any;
  component?: (props: any) => any;
  routeDefinition?: (options: RouteOptions) => any;
  createComponent?: (options: RouteOptions, props: any) => any;
  filePath?: string;
};

export type InferRouteParams<T extends RouteData> = [undefined] extends [
  T["params"],
]
  ? undefined
  : InferType<T["params"] & {}>;

export type RouteProps<T extends RouteData = RouteData> = {
  setParams: [undefined] extends [T["params"]]
    ? never
    : (params: InferRouteParams<T>) => void;
  params: InferRouteParams<T>;
  api: ResolveRouteApi<T>;
  data: T["_data"];
};
export type Route<T extends RouteData = RouteData> = ((props: any) => any) & {
  $options: RouteOptions<T>;
};

export type MergeFuncData<
  D1 extends RouteData,
  D2 extends Partial<RouteData>,
> = Merge<RouteData, D1, D2>;

export class RouteBuilder<T extends RouteData = RouteData> {
  static {
    kindRouteBuilder(this);
  }
  readonly data: T;
  readonly options: RouteOptions<T>;
  constructor(options: RouteOptions<T>) {
    this.options = options;
    this.data = {
      params: options.params,
    } as T;
  }
  protected clone(input: Partial<RouteOptions> | RouteBuilder = {}): this {
    const prev = this.options;
    const next = isRouteBuilder(input) ? input.options : input;
    return new RouteBuilder({
      ...prev,
      ...next,
      params:
        "params" in next
          ? next.params === undefined || kindOf(next.params, ObjectType)
            ? next.params
            : (s.object(next.params as any as ObjectTypeProps) as any)
          : prev.params,
    } as any) as any;
  }
  title(value: string | undefined) {
    return this.clone({ title: value });
  }
  api<TApi extends RouteApi>(
    api: TApi,
  ): RouteBuilder<MergeFuncData<T, { api: T["api"] & TApi }>> {
    return this.clone({ api }) as any;
  }
  params<TParams extends RouteParams>(
    type: TParams,
  ): RouteBuilder<MergeFuncData<T, { params: TParams }>>;
  params<TProps extends ObjectTypeProps>(
    props: TProps,
  ): RouteBuilder<MergeFuncData<T, { params: ObjectType<TProps> }>>;
  params(params: any): RouteBuilder<any> {
    return this.clone({ params });
  }
  onParamsError(
    input: { value: InferRouteParams<T> } | { redirect: string },
  ): this {
    return this.clone({ onParamsError: input as any });
  }
  path(
    value:
      | string
      | ((
          params: RoutePathParams<keyof NonNullable<T["params"]>["props"]>,
        ) => string),
  ): this {
    if (typeof value === "string") return this.clone({ path: value }) as this;
    const params: any = new Proxy(
      {},
      {
        get: (_, prop: string) => {
          const optional = (
            this.options.params?.props?.[prop as string] as Type
          ).options.optional;
          return `:${prop}${optional ? "?" : ""}`;
        },
      },
    );
    return this.clone({ path: value(params) });
  }
  preload<TData>(
    cb: (data: RoutePreloadData<T>) => TData,
  ): RouteBuilder<MergeFuncData<T, { _data: TData }>> {
    return this.clone({ preload: cb as any }) as any;
  }
  protected createRouteDefinition(): any {
    if (!this.options.routeDefinition)
      throw new Error("routeDefinition is not defined");
    return this.options.routeDefinition(this.options as RouteOptions);
  }
  create(component: (props: RouteProps<T>) => any): Route {
    const self = this.clone({ component });
    const result = function (props: any) {
      if (!self.options.createComponent)
        throw new Error("createComponent is not defined");
      return self.options.createComponent(self.options as RouteOptions, props);
    };
    kindRoute(result);
    Object.assign(result, {
      $options: self.options,
    });
    return result as any;
  }
}
