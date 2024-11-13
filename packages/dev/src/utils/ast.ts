import { generator, parser } from "./babel.js";
import type { Transform } from "./transform.js";
import { ParseResult } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as lexer from "es-module-lexer";
import { transform } from "esbuild";
import { readFile } from "fs/promises";

export function parseCode(input: string | string[]) {
  return parser.parse(Array.isArray(input) ? input.join("\n") : input, {
    sourceType: "module",
  }).program.body;
}

export type ParseFileResult = ParseResult<t.File>;

export function parseFile(code: string) {
  return parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
}

export function tryGenerate(ast: ParseFileResult | undefined, log?: boolean) {
  if (ast) {
    const generated = generator(ast);
    if (log) console.log(generated);
    return generated;
  }
}

export function getFirstChain(ref: t.Node) {
  let lastMember:
    | {
        identifier: string;
        value: t.MemberExpression;
      }
    | undefined;
  while (ref.type === "CallExpression") {
    if (ref.callee.type === "MemberExpression") {
      if (ref.callee.object.type === "Identifier") {
        lastMember = {
          identifier: ref.callee.object.name,
          value: ref.callee,
        };
        break;
      }
      ref = ref.callee.object;
    }
  }
  return lastMember;
}

export async function analyzeModule(path: string) {
  const [buffer] = await Promise.all([readFile(path), lexer.init]);
  const ast = await transform(buffer.toString(), {
    jsx: "transform",
    format: "esm",
    loader: "tsx",
  });
  return lexer.parse(ast.code, path);
}

export function findExportedNames(ast: ParseFileResult) {
  return ast.program.body
    .map((stm) => {
      if (stm.type === "ExportNamedDeclaration" && stm.declaration) {
        if (stm.declaration.type === "VariableDeclaration") {
          const [dec] = stm.declaration.declarations;
          if (dec.id.type === "Identifier") return dec.id.name;
        } else if (
          stm.declaration.type === "FunctionDeclaration" ||
          stm.declaration.type === "ClassDeclaration"
        ) {
          if (stm.declaration.id?.type === "Identifier") {
            return stm.declaration.id.name;
          }
        }
      }
    })
    .filter((v) => typeof v === "string");
}

export async function findExportedNamesFromFile(path: string) {
  const [, exports] = await analyzeModule(path);
  return exports.map((item) => item.n);
}
export function defineTransform<T>(transform: Transform<T>): Transform<T> {
  return transform;
}

export function createConst(name: string, value: t.Expression) {
  return t.variableDeclaration("const", [
    t.variableDeclarator(t.identifier(name), value),
  ]);
}

export function appendChainCall(
  input: t.Expression | string,
  method: string,
  args: t.Expression[],
) {
  if (typeof input === "string") input = t.identifier(input);

  if (input.type === "Identifier") {
    return t.callExpression(
      t.memberExpression(input, t.identifier(method)),
      args,
    );
  } else if (input.type === "CallExpression") {
    return t.callExpression(
      t.memberExpression(input, t.identifier(method)),
      args,
    );
  } else {
    throw new Error("Unsupported route type");
  }
}

export function prependChainCall(
  input: t.Expression | string,
  method: string,
  args: t.Expression[] = [],
) {
  if (typeof input === "string") input = t.identifier(input);

  if (input.type === "Identifier") {
    return t.callExpression(
      t.memberExpression(input, t.identifier(method)),
      args,
    );
  } else if (input.type === "CallExpression") {
    const cloned = t.cloneNode(input);
    const firstChain = getFirstChain(cloned);
    if (!firstChain) throw new Error("Unsupported route type");
    firstChain.value.object = t.callExpression(
      t.memberExpression(firstChain.value.object, t.identifier(method)),
      args,
    );
    return cloned;
  } else {
    throw new Error("Unsupported route type");
  }
}

export function addImports<T extends string>(
  program: NodePath<t.Program>,
  specifiers: T[],
  source: string,
): { [K in T]: string } {
  const id = specifiers.map((name) => program.scope.generateUid(name));
  program.node.body.unshift(
    t.importDeclaration(
      specifiers.map((spec, index) =>
        t.importSpecifier(t.identifier(id[index]), t.identifier(spec)),
      ),

      t.stringLiteral(source),
    ),
  );
  return specifiers.reduce(
    (result, name, index) => {
      result[name] = id[index];
      return result;
    },
    {} as Record<(typeof specifiers)[number], string>,
  );
}