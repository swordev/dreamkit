import type {
  Func,
  FuncData,
  FuncMeta,
  FuncOptions,
  FuncParams,
  FuncSelf,
  FuncTitle,
  InferFuncParams,
  MergeFuncData,
} from "./types.js";
import {
  cloneFuncOptions,
  resolveFuncParams,
  resolveFuncSelfContext,
} from "./utils/func.js";
import { kindFunc } from "./utils/kind.js";
import {
  IocFunc,
  IocParams,
  IocRegistryKey,
  IocRegistryValue,
} from "@dreamkit/ioc";
import { getKinds, kind } from "@dreamkit/kind";
import { ObjectType, ObjectTypeProps, s } from "@dreamkit/schema";

export class FuncBuilder<T extends FuncData = FuncData> {
  readonly data: T;
  readonly options: FuncOptions;
  constructor(options: FuncOptions<T>) {
    this.options = options;
    this.data = {
      params: options.params,
      self: options.self,
    } as T;
  }
  protected clone(options: Partial<FuncOptions> = {}): this {
    return new FuncBuilder(cloneFuncOptions(this.options, options)) as any;
  }
  title<TTitle extends FuncTitle>(
    value: TTitle,
  ): FuncBuilder<MergeFuncData<T, { title: TTitle }>> {
    return this.clone({ title: value }) as any;
  }
  register(key: IocRegistryKey, value: IocRegistryValue): this {
    return this.clone({ register: [[key, value]] }) as this;
  }
  self<TSelf extends FuncSelf>(
    self: TSelf,
  ): FuncBuilder<MergeFuncData<T, { self: T["self"] & TSelf }>> {
    return this.clone({ self }) as any;
  }
  params<TParams extends FuncParams>(
    type: TParams,
  ): FuncBuilder<MergeFuncData<T, { params: TParams }>>;
  params<TProps extends ObjectTypeProps>(
    props: TProps,
  ): FuncBuilder<MergeFuncData<T, { params: ObjectType<TProps> }>>;
  params(params: any): FuncBuilder<any> {
    return this.clone({ params });
  }
  cache(key?: string): this {
    return this.clone({ cache: { key } });
  }
  create<R = any>(
    body: (
      this: IocParams<T["self"]>,
      params: InferFuncParams<T["params"]>,
    ) => R,
  ): Func<T, R> {
    const $this = this;
    const func = IocFunc(
      this.options.self || {},
      this.options.register?.length ? this.options.register : undefined,
    )(function (inParams) {
      const params = resolveFuncParams($this.options, {
        params: inParams ?? {},
      });
      const paramsType = $this.options.params as ObjectType | undefined;
      paramsType?.assert(params);
      const context = resolveFuncSelfContext($this.options, {
        self: $this.options.context?.($this.options) || this,
      });
      if (context && $this.options.onCall) {
        return $this.options.onCall($this.options as FuncOptions<any>, {
          context,
          callback: body,
          params,
        });
      }
      const self: any = context
        ? context.resolveParams($this.options.self || {})
        : this;
      const $cb = body.bind(self) as any;
      return $cb(params);
    });
    const meta: FuncMeta = {
      title: $this.options.title,
      get params() {
        return $this.options.params?.props as any;
      },
      get $self() {
        return $this.options.self || {};
      },
      $clone: () => {
        const result = this.clone({}).create(body as any);
        const kinds = getKinds(func) || [];
        for (const name of kinds) kind(result, name);
        return result as any;
      },
      bind: Object.assign(func.bind, { $iocBind: true }) as any,
      $options: this.options,
    };

    Object.assign(func, meta);
    kindFunc(func);
    if (this.options.onCreate) return this.options.onCreate(func as any) as any;
    if (this.options.static) Object.assign(func, this.options.static);
    return func as any;
  }
}
