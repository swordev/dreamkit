import { kindRoute } from "../utils/kind.js";
import { kindOf } from "@dreamkit/kind";
import {
  InferType,
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
  s,
} from "@dreamkit/schema";
import type { Merge } from "@dreamkit/utils/ts.js";

export type RoutePathParams<P extends string | number | symbol> = {
  [K in P]: K extends string ? `:${K}` : never;
};

export type RouteParams = MinimalObjectType | undefined;
export type RouteData<TParams extends RouteParams = RouteParams> = {
  params?: TParams;
};

export type RouteOptions<T extends RouteData = RouteData> = T & {
  title?: string;
  path?: string;
  onParamsError?: { value: InferRouteParams<T> } | { redirect: string };
  component?: (props: any) => any;
  filePath?: string;
  createComponent?: (
    options: RouteOptions,
    component: (props?: any) => any,
  ) => any;
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
};
export type Route<T extends RouteData = RouteData> = ((props: any) => any) & {
  $options: RouteOptions<T>;
};

export type MergeFuncData<
  D1 extends RouteData,
  D2 extends Partial<RouteData>,
> = Merge<RouteData, D1, D2>;

export class RouteBuilder<T extends RouteData = RouteData> {
  readonly data: T;
  readonly options: RouteOptions<T>;
  constructor(options: RouteOptions<T>) {
    this.options = options;
    this.data = {
      params: options.params,
    } as T;
  }
  protected clone(options: Partial<RouteOptions> = {}): this {
    const prev = this.options;
    const next = options;
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
      { get: (_, prop) => `:${prop as string}` },
    );
    return this.clone({ path: value(params) });
  }
  create(component: (props: RouteProps<T>) => any): Route {
    const self = this.clone({ component });
    const result = function (props: any) {
      if (!self.options.createComponent)
        throw new Error("createComponent is not defined");
      return self.options.createComponent(
        self.options as RouteOptions,
        component,
      );
    };
    kindRoute(result);
    Object.assign(result, {
      $options: self.options,
    });
    return result as any;
  }
}
