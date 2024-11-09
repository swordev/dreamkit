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
  };

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
}

export const flagValues = Object.values(TypeFlag.Name);
