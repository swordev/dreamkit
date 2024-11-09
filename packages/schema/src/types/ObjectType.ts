import { InferType } from "../infer.js";
import { isPlainObject } from "../utils/object.js";
import * as $ from "./utils.js";

export type ObjectTypeProps = Record<string, $.MinimalType>;
export type ObjectTypeOptions<P extends ObjectTypeProps = ObjectTypeProps> =
  $.TypeOptions<{ props: P }>;
export type InferObjectProps<T extends ObjectTypeProps> = InferType<
  MinimalObjectType<T>
>;

export type ResolveOptionalFlag<T extends ObjectTypeProps> = {
  [K in keyof T as T[K]["flags"] extends { optional: true }
    ? K
    : never]?: InferType<T[K]>;
} & {
  [K in keyof T as T[K]["flags"] extends { optional: true }
    ? never
    : K]: InferType<T[K]>;
};

export class MinimalObjectType<
  P extends ObjectTypeProps = ObjectTypeProps,
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<
  {
    [K1 in keyof ResolveOptionalFlag<{
      [K2 in keyof P]: P[K2];
    }>]: ResolveOptionalFlag<{
      [K2 in keyof P]: P[K2];
    }>[K1];
  },
  F,
  "object"
> {
  readonly props!: P;
  override readonly type = "object" as const;
}

export class ObjectType<
  P extends ObjectTypeProps = ObjectTypeProps,
  F extends $.TypeFlag.Options = {},
> extends $.Type<
  {
    [K1 in keyof ResolveOptionalFlag<{
      [K2 in keyof P]: P[K2];
    }>]: ResolveOptionalFlag<{
      [K2 in keyof P]: P[K2];
    }>[K1];
  },
  F,
  "object",
  ObjectTypeOptions
> {
  static {
    $.kind(this, "ObjectType");
  }
  override readonly type = "object" as const;
  declare nullable: () => ObjectType<P, $.TypeFlag.Nullable<F>>;
  declare optional: () => ObjectType<P, $.TypeFlag.Optional<F>>;
  declare nullish: () => ObjectType<P, $.TypeFlag.Nullish<F>>;
  declare required: () => ObjectType<P, $.TypeFlag.Required<F>>;
  constructor(props: P, options: Omit<ObjectTypeOptions, "props"> = {}) {
    super({ ...options, props: { ...props } });
  }
  get props(): P {
    return this.options.props as P;
  }
  static create(options: ObjectTypeOptions): any {
    const { props, ...otherOptions } = options;
    return new ObjectType(props, otherOptions);
  }
  protected override onValidate(
    value: unknown,
    context: $.TypeContext,
  ): $.TypeAssertErrorData<any>[] {
    const val = new $.TypeValidation<"additionalProperty">(
      this as any,
      context,
      value,
      super.onValidate(value, context),
    );

    if (!val.next()) return val.errors;
    if (isPlainObject(value)) {
      for (const name in this.options.props) {
        const propType = this.options.props[name] as any as $.Type;
        const propValue = value[name];
        val.errors.push(...propType.validate(propValue, context.clone(name)));
      }
      for (const name in value) {
        if (!this.options.props[name])
          val.errors.push({
            path: [...context.path, name],
            code: "additionalProperty",
            value: value,
          });
      }
    }
    return val.errors;
  }
  protected override onCast(value: unknown) {
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      try {
        value = JSON.parse(value);
      } catch (_) {
        return value;
      }
    }
    if (!isPlainObject(value)) return value;
    let result: Record<string, any> = {};
    for (const name in this.options.props) {
      const propType = this.options.props[name] as any as $.Type;
      const propValue = value[name];
      const castedValue = propType.cast(propValue);
      if (castedValue !== undefined) result[name] = castedValue;
    }
    return result;
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    const props = Object.entries(this.props);
    return {
      type: ["object", ...(this.options.nullable ? ["null" as const] : [])],
      additionalProperties: false,
      required: props
        .filter(([, type]) => !(type as any as $.Type).options.optional)
        .map(([name]) => name),
      properties: props.reduce(
        (props, [name, type]) => {
          props[name] = (type as any as $.Type).toJsonSchema();
          return props;
        },
        {} as Record<string, $.JSONSchema7>,
      ),
    };
  }
}
