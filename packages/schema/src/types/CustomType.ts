import * as $ from "./utils.js";

export type SelfCustomTypeOptions<T> = {
  assert?: (input: any) => input is T;
  onCast?: (input: any) => any;
  onRegex?: () => RegExp;
  onJsonSchema?: () => $.JSONSchema7;
  expected?: string;
};

export type CustomTypeOptions<T> = $.TypeOptions<SelfCustomTypeOptions<T>>;

const type = "custom" as const;

export class MinimalCustomType<
  T = any,
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<T, F, typeof type> {
  override readonly type = type;
}

export class CustomType<
  T = any,
  F extends $.TypeFlag.Options = {},
> extends $.Type<T, F, typeof type, CustomTypeOptions<T>> {
  static {
    $.kind(this, "CustomType");
  }
  override readonly type = type;
  declare nullable: () => CustomType<T, $.TypeFlag.Nullable<F>>;
  declare optional: () => CustomType<T, $.TypeFlag.Optional<F>>;
  declare nullish: () => CustomType<T, $.TypeFlag.Nullish<F>>;
  declare required: () => CustomType<T, $.TypeFlag.Required<F>>;
  protected override onValidate(value: unknown, context: $.TypeContext) {
    const val = this.validation(value, context);
    if (!val.next()) return val.errors;
    if (this.options.assert && !this.options.assert(value))
      return val.addTypeError(this.options.expected);
    return val.end();
  }
  protected override onCast(input: unknown): unknown {
    return this.options.onCast
      ? this.options.onCast(input)
      : super.onCast(input);
  }
  protected override onRegex(): RegExp {
    return this.options.onRegex ? this.options.onRegex() : super.onRegex();
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return this.options.onJsonSchema
      ? this.options.onJsonSchema()
      : super.onJsonSchema();
  }
}
