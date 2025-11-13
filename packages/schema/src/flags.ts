import { SchemaFlags } from "@dreamkit/schema/override.js";
import { checkSomeObjectProp } from "@dreamkit/utils/object.js";

export namespace TypeFlag {
  export enum Name {
    Nullable = "nullable",
    Optional = "optional",
    Nullish = "nullish",
    Required = "required",
  }

  export type Merge<F1, F2> = {
    [K in keyof F1 | keyof F2 as K extends keyof F2
      ? F2[K] extends undefined
        ? never
        : K
      : K]: K extends keyof F2 ? F2[K] : K extends keyof F1 ? F1[K] : never;
  } & {};

  export type Options = {
    optional?: boolean;
    nullable?: boolean;
  } & (keyof SchemaFlags extends never ? {} : SchemaFlags);

  export type Query = {
    [K in keyof Options]?: boolean;
  };

  export type Object = {
    [Name.Nullable]: { nullable: true };
    [Name.Optional]: { optional: true };
    [Name.Nullish]: { nullable: true; optional: true };
    [Name.Required]: { nullable: undefined; optional: undefined };
  };

  export type Nullable<F> = TypeFlag.Merge<F, Object[Name.Nullable]> & {};
  export type Optional<F> = TypeFlag.Merge<F, Object[Name.Optional]> & {};
  export type Nullish<F> = TypeFlag.Merge<F, Object[Name.Nullish]> & {};
  export type Required<F> = TypeFlag.Merge<F, Object[Name.Required]> & {};

  export type CheckTypeFlags<
    F1 extends TypeFlag.Query | undefined,
    F2 extends TypeFlag.Options,
  > = [F1] extends [undefined]
    ? true
    : keyof {
        [K in keyof F1 as [F1[K]] extends [true]
          ? K extends keyof F2
            ? [F2[K]] extends [undefined]
              ? never
              : K
            : never
          : [F1[K]] extends [false]
            ? K extends keyof F2
              ? never
              : K
            : never]: true;
      };
}

export function checkTypeFlags(
  query: TypeFlag.Query,
  propFlags: TypeFlag.Options,
  nextPk?: any,
) {
  return checkSomeObjectProp(
    query,
    nextPk === true ? { ...propFlags, pk: true } : propFlags,
  );
}
