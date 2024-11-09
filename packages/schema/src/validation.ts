import { TypeContext } from "./context.js";
import type { Type } from "./types/Type.js";

export type TypeAssertErrorData<C extends string = any> = {
  path: string[];
  code: C;
  value?: unknown;
  message?: string;
};

export class TypeValidation<C extends string = any> {
  readonly errors: TypeAssertErrorData<C | "type">[] = [];
  constructor(
    protected type: Type,
    protected context: TypeContext,
    protected value: unknown,
    errors: TypeAssertErrorData<any>[] = [],
  ) {
    this.errors.push(...errors);
  }
  next() {
    if (this.errors.length) return false;
    if (this.type.options.nullable && this.value === null) return false;
    if (this.type.options.optional && this.value === undefined) return false;
    return true;
  }
  addTypeError() {
    return this.add("type" as any);
  }
  add(code: C) {
    this.errors.push({ code, path: this.context.path, value: this.value });
    return this.errors;
  }
}
