import { ArrayType, ObjectType, Type } from "@dreamkit/schema";

export class ImportScope extends Map<string, number> {
  create() {
    return new ImportSpec(this);
  }
}

export class ImportSpec extends Map<string, string> {
  constructor(protected scope: Map<string, number> = new Map()) {
    super();
  }
  set(key: string, value: string) {
    const duplications = this.scope.get(key);
    if (duplications) {
      value += duplications.toString();
      this.scope.set(key, duplications + 1);
    }
    return super.set(key, value);
  }
}

export function createRecordName(name: string, optional?: boolean) {
  const expr = /^([a-z0-9_\$]+)$/.test(name)
    ? name
    : `[${JSON.stringify(name)}]`;
  return optional ? `${expr}?` : expr;
}

export function createModuleDeclaration(
  source: string,
  body: string[],
  padding = 0,
) {
  const pad = "  ".repeat(padding);
  const sourceExpr = JSON.stringify(source);
  const bodyExpr = body.join("\n");
  return `${pad}declare module ${sourceExpr} {\n${bodyExpr}\n${pad}}`;
}

export function createInterface(
  name: string,
  props: Record<string, string>,
  padding = 0,
) {
  const pad = "  ".repeat(padding);
  const propPad = "  ".repeat(padding + 1);
  const body = Object.entries(props)
    .map(([name, value]) => `${propPad}${createRecordName(name)}: ${value};`)
    .join("\n");
  return `${pad}interface ${name} {\n${body}\n${pad}}`;
}

export function createType(type: Type): string {
  const tsType = (name: string) => {
    const values = [name];
    if (type.options.nullable) values.push("null");
    if (type.options.optional) values.push("undefined");
    return values.join(" | ");
  };
  if (type.type === "string") {
    return tsType("string");
  } else if (type.type === "number" || type.type === "integer") {
    return tsType("number");
  } else if (type.type === "boolean") {
    return tsType("boolean");
  } else if (type.type === "object") {
    const objectType = type as ObjectType;
    const props = Object.keys(objectType.options.props || {})
      .map((name) => {
        const prop = objectType.options.props![name] as Type;
        const required = !prop.options.optional;
        const nameExpr = createRecordName(name, !required);
        return `${nameExpr}: ${createType(prop)}`;
      })
      .join(", ");
    return `{ ${props} }`;
  } else if (type.type === "array") {
    const arrayType = type as ArrayType;
    return tsType(`(${createType((arrayType.items as any) || {})})[]`);
  } else {
    return "any";
  }
}
