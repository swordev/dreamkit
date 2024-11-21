import * as $ from "./utils.js";

export type StringTypeOptions = $.TypeOptions<{
  max?: number;
  min?: number;
}>;

export class MinimalStringType<
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<string, F, "string"> {
  override readonly type = "string" as const;
}

export class StringType<F extends $.TypeFlag.Options = {}> extends $.Type<
  string,
  F,
  "string",
  StringTypeOptions
> {
  static {
    $.kind(this, "StringType");
  }
  override readonly type = "string" as const;
  declare nullable: () => StringType<$.TypeFlag.Nullable<F>>;
  declare optional: () => StringType<$.TypeFlag.Optional<F>>;
  declare nullish: () => StringType<$.TypeFlag.Nullish<F>>;
  declare required: () => StringType<$.TypeFlag.Required<F>>;
  protected override onCast(value: unknown) {
    if (typeof value === "string") {
      return value;
    } else if (typeof value === "number") {
      return value.toString();
    } else {
      return value;
    }
  }
  protected override onValidate(
    value: $.TypeDef<this>,
    context: $.TypeContext,
  ) {
    const val = new $.TypeValidation<"min" | "max">(
      this as any,
      context,
      value,
      super.onValidate(value, context),
    );
    if (!val.next()) return val.errors;
    if (typeof value !== "string") return val.addTypeError("string");
    const { options } = this;
    if (typeof options.min === "number" && value.length < options.min)
      val.add("min");
    if (typeof options.max === "number" && value.length > options.max)
      val.add("max");
    return val.errors;
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return {
      type: ["string", ...(this.options.nullable ? ["null" as const] : [])],
      minLength: this.options.min,
      maxLength: this.options.max,
    };
  }
  min(value: number) {
    return this.clone({ min: value });
  }
  max(value: number) {
    return this.clone({ max: value });
  }
  length(value: number) {
    return this.clone({ min: value, max: value });
  }
}
