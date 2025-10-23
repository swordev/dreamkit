import type { StandardSchemaV1 } from "@standard-schema/spec";

export type Nullish<V, F> = F extends { null: true }
  ? null
  :
      | V
      | (F extends { nullable: true } ? null : never)
      | (F extends { optional: true } ? undefined : never);

export type InferType<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;
