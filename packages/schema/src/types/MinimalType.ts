import type { TypeFlag } from "../flags.js";
import type { Nullish } from "../infer.js";
import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";

export class MinimalType<
    D = any,
    F extends TypeFlag.Options = {},
    K extends string = string,
  >
  implements StandardSchemaV1<D>, StandardJSONSchemaV1<D>
{
  readonly kind!: K;
  get flagsValue(): F {
    return (this as any).options;
  }
  readonly "~standard": (StandardSchemaV1<Nullish<D, F>> &
    StandardJSONSchemaV1<Nullish<D, F>>)["~standard"] = {
    version: 1,
    vendor: "dreamkit",
    jsonSchema: {
      input() {
        throw new Error("Standard jsonSchema method not implemented");
      },
      output() {
        throw new Error("Standard jsonSchema method not implemented");
      },
    },
    validate: () => {
      throw new Error("Standard validate method not implemented");
    },
  };
}
