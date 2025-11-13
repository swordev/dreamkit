import { checkTypeFlags } from "../flags.js";
import { InferType } from "../infer.js";
import type {
  AssignInput,
  AssignObjectType,
  ConvertObjectType,
  ConvertType,
  DeepMergeFlags,
  DeepProjectObjectType,
  ObjectTypeMask,
} from "./../utils/object-type.js";
import * as $ from "./utils.js";
import { kindOf } from "@dreamkit/kind";
import { isPlainObject } from "@dreamkit/utils/object.js";
import { createProxy } from "@dreamkit/utils/proxy.js";
import type { Any, RecursiveRecord } from "@dreamkit/utils/ts.js";

export type ObjectTypeProps = Record<string, $.MinimalType>;
export type ObjectTypeOptions<P extends ObjectTypeProps = ObjectTypeProps> =
  $.TypeOptions<{ props: P }>;
export type InferObjectProps<T extends ObjectTypeProps> = InferType<
  MinimalObjectType<T>
>;

export type ResolveOptionalFlag<T extends ObjectTypeProps> = {
  [K in keyof T as T[K]["flagsValue"] extends { optional: true }
    ? K
    : never]?: InferType<T[K]>;
} & {
  [K in keyof T as T[K]["flagsValue"] extends { optional: true }
    ? never
    : K]: InferType<T[K]>;
};

export type FieldObjectValue<T extends $.MinimalType> =
  T extends MinimalObjectType ? FieldObject<T> : () => T;

export type FieldObject<T extends MinimalObjectType> = {
  [K in keyof T["props"]]: FieldObjectValue<T["props"][K]>;
};

export type IsEmptyObjectTypeProps<
  T extends ObjectTypeProps,
  K = keyof T,
> = K extends string
  ? T[K] extends MinimalObjectType<infer Props>
    ? IsEmptyObjectTypeProps<Props>
    : true
  : never;

export type QueryObjectType<
  T extends MinimalObjectType,
  Q extends $.TypeFlag.Query,
  P extends ObjectTypeProps = T["props"],
> =
  unknown extends Any<T>
    ? ObjectType
    : ObjectType<
        {
          [K in keyof P as P[K] extends MinimalObjectType
            ? IsEmptyObjectTypeProps<
                QueryObjectType<P[K], Q>["props"]
              > extends never
              ? never
              : K
            : $.TypeFlag.CheckTypeFlags<Q, P[K]["flagsValue"]> extends never
              ? never
              : K]: P[K] extends MinimalObjectType
            ? QueryObjectType<P[K], Q>
            : $.TypeFlag.CheckTypeFlags<Q, P[K]["flagsValue"]> extends never
              ? never
              : P[K];
        } & {},
        T["flagsValue"]
      >;

export type FlatObjectKeys<
  T extends Record<string, unknown>,
  K = keyof T,
> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${FlatObjectKeys<T[K]>}`
    : `${K}`
  : never;

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
  declare flags: <F2 extends $.SchemaFlags>(
    flags: F2,
  ) => ObjectType<P, $.TypeFlag.Merge<F, F2>>;
  readonly prop: FieldObject<ObjectType<P, F>>;
  constructor(props: P, options: Omit<ObjectTypeOptions, "props"> = {}) {
    super({ ...options, props: { ...props } });
    this.prop = createProxy((path) =>
      this.findPropOrFail(path.join(".") as any)["withContext"]({ path }),
    );
  }
  get props(): P {
    return this.options.props as P;
  }
  findProp(
    name: unknown extends Any<$.TypeDef<this>>
      ? string
      : FlatObjectKeys<$.TypeDef<this>>,
  ): $.Type | undefined {
    if (!name.length) return this as any;
    const path = name.split(".");
    let ref: $.Type = this as any;
    for (const level of path) {
      //if (kindOf(ref, ArrayType)) ref = ref.items;
      if (kindOf(ref, ObjectType)) {
        ref = ref.props[level] as any as $.Type;
      } else {
        return;
      }
    }
    return ref;
  }
  findPropOrFail(
    name: unknown extends Any<$.TypeDef<this>>
      ? string
      : FlatObjectKeys<$.TypeDef<this>>,
  ): $.Type {
    const prop = this.findProp(name);
    if (!prop) throw new Error(`Property not found: ${name}`);
    return prop;
  }
  static create(options: ObjectTypeOptions): any {
    const { props, ...otherOptions } = options;
    return new ObjectType(props, otherOptions);
  }
  create(
    data: any,
    cb?: (data: { path: string[]; type: $.Type; value: any }) => any,
    path?: string[],
    output: Record<string, any> = {},
  ): any {
    for (const name in this.props) {
      const type = this.props[name] as any as $.Type;
      const typePath = [...(path || []), name];
      const value = data?.[name];
      if (
        kindOf(type, ObjectType) &&
        (!!value || (!type.options.nullable && !type.options.optional))
      ) {
        output[name] = {};
        type.create(value, cb, typePath, output[name]);
      } else {
        const newValue = cb ? cb({ path: typePath, type, value }) : value;
        if (newValue !== undefined) output[name] = newValue;
      }
    }
    return output;
  }
  protected override onValidate(
    value: unknown,
    context: $.TypeContext,
  ): $.TypeAssertErrorData<any>[] {
    const val = this.validation<"additionalProperty">(value, context);
    if (!val.next()) return val.errors;
    if (!isPlainObject(value)) return val.addTypeError("plain-object");
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
        });
    }

    return val.end();
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
  pick<Input extends ObjectTypeMask<P>>(
    input: Input,
  ): DeepProjectObjectType<this, Input> {
    return this.clone({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          if (input[name]) {
            props[name] = kindOf(prop, ObjectType)
              ? input[name] === true
                ? prop
                : prop.pick(input[name] as any)
              : prop;
          }
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  omit<Input extends ObjectTypeMask<P>>(
    input: Input,
  ): DeepProjectObjectType<this, Input, false> {
    return this.clone({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          if (!input[name]) {
            props[name] = prop;
          } else if (kindOf(prop, ObjectType)) {
            if (input[name] && input[name] !== true) {
              props[name] = prop.omit(input[name] as any);
            }
          }
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  assign<TAssign extends AssignInput>(
    props: TAssign,
    mergeObjectTypes: true,
  ): AssignObjectType<this, TAssign, true>;
  assign<TAssign extends AssignInput>(
    props: TAssign,
  ): AssignObjectType<this, TAssign>;
  assign(props: AssignInput, merge = false): any {
    if (!isPlainObject(props))
      throw new Error(`Assign props is not plain object: ${props}`);
    return this.clone({
      props: Object.entries(props).reduce(
        (props, [name, assignProp]) => {
          if (merge && kindOf(assignProp, ObjectType))
            assignProp = assignProp["props"];
          props[name] = kindOf(assignProp, $.MinimalType)
            ? assignProp
            : kindOf(props[name], ObjectType)
              ? ((props[name] as ObjectType).assign(
                  assignProp as AssignInput,
                  merge as true,
                ) as any)
              : new ObjectType({}, {}).assign(assignProp as any, merge as true);
          return props;
        },
        { ...this.props } as ObjectTypeProps,
      ) as P,
    });
  }
  require(): ObjectType<
    {
      [K in keyof P]: ConvertType<P[K], $.TypeFlag.Name.Required>;
    },
    F
  >;
  require<
    Mask extends {
      [k in keyof P]?: true;
    },
  >(mask: Mask): ConvertObjectType<this, Mask, $.TypeFlag.Name.Required>;
  require(mask?: Record<string, boolean>): any {
    return this.clone({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          props[name] =
            !mask || mask[name]
              ? (prop as any as $.Type)["clone"]({
                  optional: undefined,
                  nullable: undefined,
                })
              : prop;
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  partial(): ObjectType<
    {
      [K in keyof P]: ConvertType<P[K], $.TypeFlag.Name.Optional>;
    },
    F
  >;
  partial<
    Mask extends {
      [k in keyof P]?: true;
    },
  >(mask: Mask): ConvertObjectType<this, Mask, $.TypeFlag.Name.Optional>;
  partial(mask?: Record<string, boolean>): any {
    return this.clone({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          props[name] =
            !mask || mask[name]
              ? (prop as $.Type)["clone"]({ optional: true })
              : prop;
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  deepPartial(): DeepMergeFlags<this, $.TypeFlag.Name.Optional>;
  deepPartial<Q extends $.TypeFlag.Query>(
    query: Q,
  ): DeepMergeFlags<this, $.TypeFlag.Name.Optional, Q, false>;
  deepPartial(
    self: true,
  ): DeepMergeFlags<this, $.TypeFlag.Name.Optional, undefined, true>;
  deepPartial(input?: any): any {
    const self = input === true;
    const query = input && input !== true ? input : undefined;
    return (self ? this.optional() : this)["clone"]({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          props[name] = kindOf(prop, ObjectType)
            ? prop.deepPartial(true)
            : !query || checkTypeFlags(query, prop.flagsValue)
              ? (prop as $.Type).optional()
              : prop;
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  deepRequired(): ObjectType<
    DeepMergeFlags<this, $.TypeFlag.Name.Required>["props"],
    F
  >;
  deepRequired(self: true): DeepMergeFlags<this, $.TypeFlag.Name.Required>;
  deepRequired(self?: boolean): any {
    return (self ? this.required() : this)["clone"]({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          props[name] = kindOf(prop, ObjectType)
            ? prop.deepRequired(true)
            : (prop as $.Type).required();
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  deepNullish(): ObjectType<
    DeepMergeFlags<this, $.TypeFlag.Name.Nullable>["props"],
    F
  >;
  deepNullish(self: true): DeepMergeFlags<this, $.TypeFlag.Name.Nullable>;
  deepNullish(self?: boolean): any {
    return (self ? this.nullish() : this)["clone"]({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          props[name] = kindOf(prop, ObjectType)
            ? prop.deepNullish(true)
            : (prop as $.Type).nullish();
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
  iterateProps(
    cb: (name: string, type: $.Type) => void | false,
    parentNames: string[] = [],
  ) {
    for (const name in this.props) {
      const type = this.props[name] as any as $.Type;
      const names = [...parentNames, name];
      if (kindOf(type, ObjectType)) {
        type.iterateProps(cb, names);
      } else if (cb(names.join("."), type) === false) {
        break;
      }
    }
  }
  query<Q extends $.TypeFlag.Query>(
    flags: Q,
    outMask?: RecursiveRecord<boolean>,
  ): QueryObjectType<this, Q> {
    const someFlag = Object.entries(flags).some(
      ([, v]) => typeof v === "boolean",
    );
    if (!someFlag) return this.clone({});
    return this.clone({
      props: Object.entries(this.options.props).reduce(
        (props, [name, prop]) => {
          if (kindOf(prop, ObjectType)) {
            const nextOutMask = outMask ? (outMask[name] = {}) : undefined;
            const objectProp = prop.query(flags, nextOutMask);
            let someChildProp = false;
            objectProp.iterateProps(() => !(someChildProp = true));
            if (someChildProp) {
              props[name] = objectProp;
            } else {
              if (outMask) outMask[name] = false;
            }
          } else {
            if (checkTypeFlags(flags, prop.flagsValue))
              props[name] = (prop as $.Type)["clone"]({} as any);
            if (outMask) outMask[name] = !!props[name];
          }
          return props;
        },
        {} as ObjectTypeProps,
      ) as P,
    });
  }
}
