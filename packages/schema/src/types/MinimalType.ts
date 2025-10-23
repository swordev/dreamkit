import type { TypeFlag } from "../flags.js";
import type { Nullish } from "../infer.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export const kind = Symbol("kind");

export class MinimalType<
  D = any,
  F extends TypeFlag.Options = {},
  N extends string = string,
> implements StandardSchemaV1<D>
{
  readonly [kind]!: "schema";
  readonly type!: N;
  readonly flags!: F;
  readonly "~standard": StandardSchemaV1<Nullish<D, F>>["~standard"] = {
    version: 1,
    vendor: "dreamkit",
    validate: () => {
      throw new Error("Standard validate method not implemented");
    },
  };
}
