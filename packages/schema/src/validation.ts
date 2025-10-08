import { TypeContext } from "./context.js";
import type { Type } from "./types/Type.js";
import { typeOf } from "./utils/object.js";

export type TypeAssertErrorData<C extends string = any> = {
  path: string[];
  code: C;
  expected?: string;
  received?: string;
  message?: string;
};

export class TypeAssertError extends Error {
  public name = "TypeAssertError";
  constructor(readonly errors: TypeAssertErrorData[]) {
    super(JSON.stringify(errors, null, 2));
  }
}

export function isTypeAssertError(error: unknown): error is TypeAssertError {
  return (
    error instanceof Error && error.name === TypeAssertError.prototype.name
  );
}

export class TypeValidation<C extends string = any> {
  readonly errors: TypeAssertErrorData<C | "type" | "refine">[] = [];
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
  addTypeError(expected?: string) {
    return this.add("type" as any, {
      received: typeOf(this.value),
      ...(expected && { expected }),
    });
  }
  add(code: C, data?: Partial<TypeAssertErrorData>) {
    this.errors.push({
      code,
      path: this.context.path,
      ...data,
    });
    return this.errors;
  }
  end() {
    if (this.type.options.refine && !this.errors.length) {
      const result = this.type.options.refine(this.value);
      if (Array.isArray(result)) return result;
      if (!result) return this.add("refine" as any);
    }
    return this.errors;
  }
}
