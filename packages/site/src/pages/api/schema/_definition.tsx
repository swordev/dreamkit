import type {
  BoolType,
  NumberType,
  ObjectType,
  StringType,
  FileType,
  ArrayType,
  Type,
} from "dreamkit";

declare module "dreamkit/definitions" {
  const s: {
    title(value: string): typeof s;
    object(props: Record<string, Type>): ObjectType;
    array(type: Type): ArrayType;
    string(): StringType;
    number(): NumberType;
    bool(): BoolType;
    file(): FileType;
  };
}
