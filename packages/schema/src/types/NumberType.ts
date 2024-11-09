import * as $ from "./utils.js";

export type NumberTypeOptions = $.TypeOptions<{
  max?: number;
  min?: number;
  integer?: boolean;
}>;

export class MinimalNumberType<
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<string, F, "number"> {
  override readonly type = "number" as const;
}

export class NumberType<F extends $.TypeFlag.Options = {}> extends $.Type<
  number,
  F,
  "number",
  NumberTypeOptions
> {
  static {
    $.kind(this, "NumberType");
  }
  override readonly type = "number" as const;
  declare nullable: () => NumberType<$.TypeFlag.Nullable<F>>;
  declare optional: () => NumberType<$.TypeFlag.Optional<F>>;
  declare nullish: () => NumberType<$.TypeFlag.Nullish<F>>;
  declare required: () => NumberType<$.TypeFlag.Required<F>>;
  protected override onCast(value: unknown) {
    if (typeof value === "number") {
      return value;
    } else if (typeof value === "string" && /^[+-]?\d+(\.\d+)?$/.test(value)) {
      const number = Number(value);
      return number || 0;
    } else {
      return value;
    }
  }
  protected override onValidate(
    value: $.TypeDef<this>,
    context: $.TypeContext,
  ) {
    const val = new $.TypeValidation<"min" | "max" | "integer">(
      this as any,
      context,
      value,
      super.onValidate(value, context),
    );
    if (!val.next()) return val.errors;
    if (typeof value !== "number") return val.addTypeError();
    const { options } = this;
    if (typeof options.min === "number" && value < options.min) val.add("min");
    if (typeof options.max === "number" && value > options.max) val.add("max");
    if (options.integer && !Number.isInteger(value)) val.add("integer");
    return val.errors;
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return {
      type: [
        this.options.integer ? "integer" : "number",
        ...(this.options.nullable ? ["null" as const] : []),
      ],
      minimum: this.options.min,
      maximum: this.options.max,
    };
  }
  min(value: number) {
    return this.clone({ min: value });
  }
  max(value: number) {
    return this.clone({ max: value });
  }
  integer(value = true) {
    return this.clone({ integer: value });
  }
}
