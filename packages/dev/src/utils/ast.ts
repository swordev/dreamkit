import { generator, parser } from "./babel.js";
import type { Transform } from "./transform.js";
import { ParseResult } from "@babel/parser";
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

export function addFileChanges(ast: ParseFileResult, value: number) {
  (ast as any)["__changes"] = ((ast as any)["__changes"] || 0) + value;
  return value;
}

export function getFileChanges(ast: ParseFileResult) {
  return Number((ast as any)["__changes"]) || 0;
}

export function generateIfChanges(
  ast: ParseFileResult | undefined,
  log?: boolean,
) {
  if (ast && getFileChanges(ast)) {
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
