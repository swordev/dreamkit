import { AnyType } from "./types/AnyType.js";
import { ArrayType, type ArrayTypeItems } from "./types/ArrayType.js";
import { BoolType } from "./types/BoolType.js";
import { CustomType, SelfCustomTypeOptions } from "./types/CustomType.js";
import { FileType } from "./types/FileType.js";
import { NumberType } from "./types/NumberType.js";
import { ObjectType, type ObjectTypeProps } from "./types/ObjectType.js";
import { StringType } from "./types/StringType.js";
import { Type } from "./types/Type.js";
import { kindOf } from "@dreamkit/kind";

export type SchemaOptions = {
  title?: string;
};

export class Schema {
  private typeOptions: { title?: string };
  constructor(protected options: SchemaOptions = {}) {
    this.typeOptions = options.title ? { title: options.title } : {};
  }
  title(value: string | undefined): this {
    return new Schema({
      ...this.options,
      title: value,
    }) as any;
  }
  any() {
    return new AnyType(this.typeOptions);
  }
  array<I extends ArrayTypeItems>(items: I): ArrayType<I> {
    return new ArrayType<I>(items, this.typeOptions);
  }
  bool(): BoolType {
    return new BoolType(this.typeOptions);
  }
  number(): NumberType {
    return new NumberType(this.typeOptions);
  }
  object<P extends ObjectTypeProps>(props: P): ObjectType<P> {
    return new ObjectType<P>(props, this.typeOptions);
  }
  string(): StringType {
    return new StringType(this.typeOptions);
  }
  file(): FileType {
    return new FileType(this.typeOptions);
  }
  custom<T>(
    test?: SelfCustomTypeOptions<T>["test"],
    options?: Omit<SelfCustomTypeOptions<T>, "test">,
  ): CustomType<T>;
  custom<T>(options: SelfCustomTypeOptions<T>): CustomType<T>;
  custom<T>(...args: any[]): CustomType {
    if (typeof args[0] === "function" || kindOf(args[0], Type)) {
      const [test, options] = args as [
        SelfCustomTypeOptions<T>["test"],
        Omit<SelfCustomTypeOptions<T>, "test">,
      ];
      return new CustomType<T>({ test, ...options });
    } else if (args.length === 2) {
      const [, options] = args as [any, SelfCustomTypeOptions<T>];
      return new CustomType<T>(options);
    } else {
      const [options] = args as [SelfCustomTypeOptions<T>];
      return new CustomType<T>(options);
    }
  }
}
