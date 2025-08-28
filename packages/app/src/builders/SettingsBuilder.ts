import { createKind, kindOf } from "@dreamkit/kind";
import {
  InferType,
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
  s,
} from "@dreamkit/schema";
import type { Merge, throwError } from "@dreamkit/utils/ts.js";

export const [kindSettings, isSettings] = createKind<SettingsConstructor>(
  "@dreamkit/app/settings",
);

export type SettingsName = string | undefined;
export type SettingsParams = MinimalObjectType | undefined;
export type InferSettingsParams<T extends { params?: SettingsParams }> =
  InferType<T["params"] & {}>;
export type SettingsDefaults<TParams extends SettingsParams = SettingsParams> =
  | ((input: InferSettingsParams<{ params: NoInfer<TParams> }>) => any)
  | undefined;

export type SettingsData<
  TName extends SettingsName = SettingsName,
  TParams extends SettingsParams = SettingsParams,
  TDefaults extends SettingsDefaults = SettingsDefaults,
> = {
  name?: TName;
  params?: TParams;
  defaults?: TDefaults;
};

export type SettingsOptions<T extends SettingsData = SettingsData> = T & {
  generate?: (input: Record<string, unknown>) => InferType<T["params"] & {}>;
  optional?: boolean;
  static?: Record<string, any>;
};

export type MergeSettingsData<
  D1 extends SettingsData,
  D2 extends Partial<SettingsData>,
> = Merge<SettingsData, D1, D2>;

export abstract class Settings<T extends SettingsData = SettingsData> {
  static get options(): SettingsOptions {
    throw new Error("Not implemented");
  }
  static get params() {
    throw new Error("Not implemented");
  }
  static {
    kindSettings(this);
  }
  readonly options: SettingsOptions<T> = (this.constructor as any).options;
  readonly params!: [undefined] extends [T["defaults"]]
    ? InferSettingsParams<T>
    : ReturnType<T["defaults"] & {}>;
  constructor(params: InferSettingsParams<T>) {
    this.update(params);
  }
  update(params: InferSettingsParams<T>) {
    const options = (this.constructor as SettingsConstructor).options;
    const errors = (options.params as ObjectType).validate(params);
    if (errors.length)
      throw new Error(
        `Invalid '${options.name}' settings: ${JSON.stringify(errors, null, 2)}`,
      );
    (this as any).params = options.defaults
      ? options.defaults(params as any)
      : params;
  }
}

export interface SettingsConstructor<T extends SettingsData = SettingsData> {
  options: SettingsOptions<T>;
  params: T["params"];
  new (params: InferSettingsParams<T>): Settings<T>;
}

export class SettingsBuilder<
  T extends SettingsData = { name: undefined; params: undefined },
> {
  readonly data: T;
  readonly options: SettingsOptions<T>;
  constructor(options: SettingsOptions<T> = {} as any) {
    this.options = options;
    this.data = {
      params: options.params,
    } as T;
  }
  protected clone(next: Partial<SettingsOptions>): this {
    const prev = this.options;
    return new SettingsBuilder({
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
  name<TName extends SettingsName>(
    value: TName,
  ): SettingsBuilder<MergeSettingsData<T, { name: TName }>> {
    return this.clone({ name: value }) as any;
  }
  optional(value = true): this {
    return this.clone({ optional: value });
  }
  defaults<D>(
    value: (input: InferSettingsParams<T>) => D,
  ): SettingsBuilder<MergeSettingsData<T, { defaults: () => D }>> {
    return this.clone({ defaults: value } as any) as any;
  }
  generate(
    value: (input: { [K in keyof InferSettingsParams<T>]?: any }) =>
      | Partial<InferSettingsParams<T>>
      | undefined,
  ): this {
    return this.clone({ generate: value } as any);
  }
  params<TParams extends SettingsParams>(
    type: TParams,
  ): SettingsBuilder<MergeSettingsData<T, { params: TParams }>>;
  params<TProps extends ObjectTypeProps>(
    props: TProps,
  ): SettingsBuilder<MergeSettingsData<T, { params: ObjectType<TProps> }>>;
  params(params: any): SettingsBuilder<any> {
    return this.clone({ params });
  }
  create: [undefined] extends [T["name"]]
    ? throwError<"Name is required">
    : [undefined] extends [T["params"]]
      ? throwError<"Params is required">
      : () => SettingsConstructor<T> = function (this: SettingsBuilder) {
    if (!this.options.name) throw new Error("Name is required");
    if (!this.options.params) throw new Error("Params is required");
    const self = this;
    class CustomSettings extends Settings<T> {
      static {
        kindSettings(this, self.options.name);
      }
      static override get options(): any {
        return self.options;
      }
      static override get params(): any {
        return self.options.params;
      }
      constructor(params: InferSettingsParams<T>) {
        super(params);
      }
    }
    if (this.options.static) Object.assign(CustomSettings, this.options.static);
    return CustomSettings;
  } as any;
}
