import type { TypeFlag } from "../flags.js";
import type { Nullish } from "../infer.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export class MinimalType<
  D = any,
  F extends TypeFlag.Options = {},
  K extends string = string,
> implements StandardSchemaV1<D>
{
  readonly kind!: K;
  get flagsValue(): F {
    return (this as any).options;
  }
  readonly "~standard": StandardSchemaV1<Nullish<D, F>>["~standard"] = {
    version: 1,
    vendor: "dreamkit",
    validate: () => {
      throw new Error("Standard validate method not implemented");
    },
  };
}
