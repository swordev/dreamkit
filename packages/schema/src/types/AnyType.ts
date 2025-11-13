import * as $ from "./utils.js";

export type AnyTypeOptions = $.TypeOptions<{}>;

const type = "any" as const;

export class MinimalAnyType<
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<any, F, typeof type> {
  override readonly type = type;
}

export class AnyType<F extends $.TypeFlag.Options = {}> extends $.Type<
  any,
  F,
  typeof type,
  AnyTypeOptions
> {
  static {
    $.kind(this, "AnyType");
  }
  override readonly type = type;
  declare nullable: () => AnyType<$.TypeFlag.Nullable<F>>;
  declare optional: () => AnyType<$.TypeFlag.Optional<F>>;
  declare nullish: () => AnyType<$.TypeFlag.Nullish<F>>;
  declare required: () => AnyType<$.TypeFlag.Required<F>>;
  declare flags: <F2 extends $.SchemaFlags>(
    flags: F2,
  ) => AnyType<$.TypeFlag.Merge<F, F2>>;
  protected override onJsonSchema(): $.JSONSchema7 {
    return {};
  }
}
