import type { MinimalType } from "./types/MinimalType.js";

export type Nullish<V, F> = F extends { null: true }
  ? null
  :
      | V
      | (F extends { nullable: true } ? null : never)
      | (F extends { optional: true } ? undefined : never);

export type TypeDef<T extends MinimalType> =
  // @ts-expect-error
  T["def"];

export type InferType<T extends MinimalType> = Nullish<TypeDef<T>, T["flags"]>;
