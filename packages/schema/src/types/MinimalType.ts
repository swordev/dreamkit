import type { TypeFlag } from "../flags.js";

export const kind = Symbol("kind");

export class MinimalType<
  D = any,
  F extends TypeFlag.Options = {},
  N extends string = string,
> {
  readonly [kind]!: "schema";
  readonly type!: N;
  readonly flags!: F;
  protected readonly def!: D;
}
