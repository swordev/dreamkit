import * as $ from "./utils.js";
import { kindOf } from "@dreamkit/kind";

export type SelfCustomTypeOptions<T> = {
  onCast?: (input: any) => any;
  onRegex?: () => RegExp;
  onJsonSchema?: () => $.JSONSchema7;
  expected?: string;
  test?: ((input: any) => input is T) | $.MinimalType<T>;
};

export type CustomTypeOptions<T> = $.TypeOptions<SelfCustomTypeOptions<T>>;

const type = "custom" as const;

export class MinimalCustomType<
  T = any,
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<T, F, typeof type> {
  override readonly kind = type;
}

export class CustomType<
  T = any,
  F extends $.TypeFlag.Options = {},
> extends $.Type<T, F, typeof type, CustomTypeOptions<T>> {
  static {
    $.kind(this, "CustomType");
  }
  override readonly kind = type;
  declare nullable: () => CustomType<T, $.TypeFlag.Nullable<F>>;
  declare optional: () => CustomType<T, $.TypeFlag.Optional<F>>;
  declare nullish: () => CustomType<T, $.TypeFlag.Nullish<F>>;
  declare required: () => CustomType<T, $.TypeFlag.Required<F>>;
  declare flags: <F2 extends $.SchemaFlags>(
    flags: F2,
  ) => CustomType<T, $.TypeFlag.Merge<F, F2>>;
  protected override onValidate(value: unknown, context: $.TypeContext) {
    const val = this.validation(value, context);
    if (!val.next()) return val.errors;
    const test = this.options.test;
    if (kindOf(test, $.Type)) {
      if (!test.test(value)) return val.addTypeError(this.options.expected);
    } else if (typeof test === "function") {
      if (!(test as any)(value)) return val.addTypeError(this.options.expected);
    }
    return val.end();
  }
  protected getTypeTestOption(): $.Type | undefined {
    return this.options.test instanceof $.Type ? this.options.test : undefined;
  }
  protected override onCast(input: unknown): unknown {
    return this.options.onCast
      ? this.options.onCast(input)
      : super.onCast(input);
  }
  protected override onRegex(): RegExp {
    return this.options.onRegex
      ? this.options.onRegex()
      : (this.getTypeTestOption()?.regex() ?? super.onRegex());
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return this.options.onJsonSchema
      ? this.options.onJsonSchema()
      : (this.getTypeTestOption()?.toJsonSchema() ?? super.onJsonSchema());
  }
}
