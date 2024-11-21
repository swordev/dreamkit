import { InferType } from "../infer.js";
import * as $ from "./utils.js";

export type ArrayTypeItems = $.MinimalType;

export type ArrayTypeOptions<I extends ArrayTypeItems = ArrayTypeItems> =
  $.TypeOptions<{
    items: I;
    min?: number;
    max?: number;
  }>;

export class MinimalArrayType<
  I extends ArrayTypeItems = ArrayTypeItems,
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<InferType<I>[], F, "array"> {
  override readonly type = "array" as const;
  readonly items!: I;
}

export class ArrayType<
  I extends ArrayTypeItems = ArrayTypeItems,
  F extends $.TypeFlag.Options = {},
> extends $.Type<InferType<I>[], F, "array", ArrayTypeOptions> {
  static {
    $.kind(this, "ArrayType");
  }
  override readonly type = "array" as const;
  declare nullable: () => ArrayType<I, $.TypeFlag.Nullable<F>>;
  declare optional: () => ArrayType<I, $.TypeFlag.Optional<F>>;
  declare nullish: () => ArrayType<I, $.TypeFlag.Nullish<F>>;
  declare required: () => ArrayType<I, $.TypeFlag.Required<F>>;
  declare reset: () => ArrayType<I>;
  constructor(
    readonly items: I,
    options: Omit<ArrayTypeOptions, "items"> = {},
  ) {
    super({ ...options, items });
  }
  static create(options: ArrayTypeOptions) {
    const { items, ...otherOptions } = options;
    return new ArrayType(items, otherOptions);
  }
  protected override onValidate(
    value: unknown,
    context: $.TypeContext,
  ): $.TypeAssertErrorData[] {
    const val = new $.TypeValidation<"min" | "max">(
      this as any,
      context,
      value,
      super.onValidate(value, context),
    );
    if (!val.next()) return val.errors;
    if (!Array.isArray(value)) return val.addTypeError("array");
    const { options } = this;
    if (typeof options.min === "number" && value.length < options.min)
      val.add("min");
    if (typeof options.max === "number" && value.length > options.max)
      val.add("max");
    if (!val.errors.length) {
      let index = 0;
      for (const item of value) {
        val.errors.push(
          ...(options.items as any as $.Type).validate(
            item,
            context.clone(index.toString()),
          ),
        );
        index++;
      }
    }
    return val.errors;
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return {
      type: ["array", ...(this.options.nullable ? ["null" as const] : [])],
      items: (this.items as any as $.Type).toJsonSchema(),
      minItems: this.options.min,
      maxItems: this.options.max,
    };
  }

  min(value: number | undefined) {
    return this.clone({ min: value });
  }
  max(value: number | undefined) {
    return this.clone({ max: value });
  }
}
