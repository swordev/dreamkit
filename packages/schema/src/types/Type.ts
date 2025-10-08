import { TypeContext } from "../context.js";
import { type TypeFlag, flagValues } from "../flags.js";
import { InferType, TypeDef } from "../infer.js";
import { kindSchema } from "../utils/kind.js";
import {
  TypeAssertError,
  TypeValidation,
  type TypeAssertErrorData,
} from "../validation.js";
import { MinimalType } from "./MinimalType.js";
import type { JSONSchema7 } from "json-schema";

export type TypeConstructor<T extends Type = Type> = {
  new (...args: any[]): T;
  type: string;
};

export type TypeOptions<O = {}> = TypeFlag.Options & {
  title?: string;
  refine?: (input: any) => boolean | TypeAssertErrorData[];
} & O;

export type Context = {
  path: string[];
};

export abstract class Type<
  D = any,
  F extends TypeFlag.Options = {},
  N extends string = string,
  O extends TypeOptions = TypeOptions,
> extends MinimalType<D, F, N> {
  static {
    kindSchema(this, "Type");
  }
  protected context: Context | undefined;
  constructor(readonly options: O = {} as any) {
    super();
    (this as any).flags = {} as F;
    for (const key in options) {
      if (flagValues.includes(key as any))
        (this.flags as any)[key] = (options as any)[key];
    }
  }
  protected onClone(options: O): Type {
    const Constructor = (this as any).constructor;
    if (Constructor.create) {
      return Constructor.create(options) as Type;
    } else {
      return new Constructor(options) as Type;
    }
  }
  protected onJsonSchema(): JSONSchema7 {
    throw new Error("Not implemented");
  }
  protected onValidate(
    input: unknown,
    context: TypeContext,
  ): TypeAssertErrorData[] {
    return [];
  }
  protected onParse(input: unknown, context: TypeContext): unknown {
    return input;
  }
  protected onCast(input: unknown): unknown {
    return input;
  }
  protected onRegex(): RegExp {
    return /^.+$/;
  }
  protected clone<R = this>(options: Partial<O> = {} as any): R {
    const newOptions: Record<string, any> = { ...this.options };
    for (const key in options) {
      const value = (options as any)[key];
      if (value === undefined) {
        delete newOptions[key];
      } else {
        newOptions[key] = value;
      }
    }
    return this.onClone(newOptions as any) as any;
  }
  protected withContext(context: Context): this {
    const self = this.clone();
    self["context"] = context;
    return self;
  }
  title(value: string | undefined): this {
    return this.clone({ title: value } as any);
  }
  // [workaround] https://github.com/microsoft/TypeScript/issues/6223
  nullable(): Type<D, TypeFlag.Nullable<F>, N> {
    return this.clone({ nullable: true } as any);
  }
  optional(): Type<D, TypeFlag.Optional<F>> {
    return this.clone({ optional: true } as any);
  }
  nullish(): Type<D, TypeFlag.Nullish<F>> {
    return this.clone({ nullable: true, optional: true } as any);
  }
  required(): Type<D, TypeFlag.Required<F>> {
    return this.clone({ nullable: undefined, optional: undefined } as any);
  }
  refine(
    refine: (input: InferType<this>) => boolean | TypeAssertErrorData[],
  ): this {
    return this.clone({ refine } as any);
  }
  protected validation<C extends string>(input: unknown, context: TypeContext) {
    return new TypeValidation<C>(this as any, context, input);
  }
  validate(input: unknown, context?: TypeContext): TypeAssertErrorData<any>[] {
    return this.onValidate(
      input,
      context || new TypeContext({ ...this.context, input }),
    );
  }
  test(value: unknown): boolean {
    return !this.validate(value).length;
  }
  assert(value: unknown): asserts value is TypeDef<this> {
    const errors = this.validate(value);
    if (errors.length) throw new TypeAssertError(errors);
  }
  parse(input: TypeDef<this>, context?: TypeContext): unknown {
    if (!context) context = new TypeContext({ input });
    return this.onParse(input, context) as any;
  }
  safeParse(input: TypeDef<this>): InferType<this> {
    const parsed = this.parse(input);
    this.assert(parsed);
    return parsed as any;
  }
  cast(input: unknown): unknown {
    if (
      // "" -> null | undefined
      input === ""
    ) {
      if (this.options.nullable) return null;
      if (this.options.optional) return undefined;
    }
    return this.onCast(input);
  }
  regex(): RegExp {
    return this.onRegex();
  }
  create(value: InferType<this>): InferType<this> {
    return value;
  }
  toJsonSchema(): JSONSchema7 {
    return this.onJsonSchema();
  }
}
