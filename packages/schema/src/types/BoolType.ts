import * as $ from "./utils.js";

export type BoolTypeOptions = $.TypeOptions<{}>;

const type = "bool" as const;

export class MinimalBoolType<
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<string, F, typeof type> {
  override readonly type = type;
}

export class BoolType<F extends $.TypeFlag.Options = {}> extends $.Type<
  boolean,
  F,
  typeof type,
  BoolTypeOptions
> {
  static {
    $.kind(this, "BoolType");
  }
  override readonly type = type;
  declare nullable: () => BoolType<$.TypeFlag.Nullable<F>>;
  declare optional: () => BoolType<$.TypeFlag.Optional<F>>;
  declare nullish: () => BoolType<$.TypeFlag.Nullish<F>>;
  declare required: () => BoolType<$.TypeFlag.Required<F>>;
  protected override onCast(value: unknown) {
    if (typeof value === "boolean") {
      return value;
    } else if (typeof value === "string") {
      if (value === "true" || value === "1") {
        return true;
      } else if (value === "false" || value === "0") {
        return false;
      }
    }
    return value;
  }
  protected override onValidate(value: unknown, context: $.TypeContext) {
    const val = new $.TypeValidation<"min" | "max" | "integer">(
      this as any,
      context,
      value,
      super.onValidate(value, context),
    );
    if (!val.next()) return val.errors;
    if (typeof value === "boolean") return val.addTypeError();
    return val.errors;
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return {
      type: ["boolean", ...(this.options.nullable ? ["null" as const] : [])],
    };
  }
}
