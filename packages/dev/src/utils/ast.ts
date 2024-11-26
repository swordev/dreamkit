import { generator, parser, traverse } from "./babel.js";
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

export function tryGenerate(
  ast: ParseFileResult | undefined,
  log?: boolean | string,
) {
  if (ast) {
    const generated = generator(ast);
    if (log) {
      if (typeof log === "string") {
        console.log({ id: log, ...generated });
      } else {
        console.log(generated);
      }
    }
    return generated;
  }
}

export type InputChain = {
  rootName: string;
  calls: { name: string; arguments: any[] }[];
};

export type Chain = {
  rootName: string;
  root: t.Identifier;
  calls: {
    node: t.CallExpression;
    property: t.Identifier;
    name: string;
    arguments: any[];
  }[];
};

export function parseCallsChain(input: t.CallExpression): Chain {
  let ref: t.Node = input;
  let rootName!: string;
  let root!: t.Identifier;
  let calls: Chain["calls"] = [];
  while (true) {
    if (ref.callee.type === "MemberExpression") {
      if (ref.callee.property.type !== "Identifier")
        throw new Error("Invalid chain");
      calls.push({
        node: ref,
        name: ref.callee.property.name,
        property: ref.callee.property,
        arguments: ref.arguments,
      });
      if (ref.callee.object.type === "Identifier") {
        root = ref.callee.object;
        rootName = ref.callee.object.name;
        break;
      } else if (ref.callee.object.type === "CallExpression") {
        ref = ref.callee.object;
      } else {
        break;
      }
    }
  }

  return { root, rootName, calls: calls.reverse() };
}

export function createCallChains(chain: InputChain) {
  let ref: t.Expression = t.identifier(chain.rootName);
  for (const call of chain.calls) {
    ref = t.callExpression(
      t.memberExpression(ref, t.identifier(call.name)),
      call.arguments,
    );
  }
  return ref;
}

export function removeChainCalls(input: t.CallExpression, names: string[]) {
  const root = t.cloneNode(input);
  let ref: t.Node = root;
  while (ref.type === "CallExpression") {
    ref = t.callExpression(ref.callee, ref.arguments);
    if (ref.callee.type === "MemberExpression") {
      if (ref.callee.property.type === "Identifier") {
        if (names.includes(ref.callee.property.name)) continue;
      }
      ref = ref.callee.object;
    }
  }
  return root;
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
    .flatMap((stm) => {
      if (stm.type === "ExportDefaultDeclaration") {
        return "default";
      } else if (stm.type === "ExportNamedDeclaration") {
        if (stm.declaration) {
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
        } else if (stm.specifiers) {
          return stm.specifiers
            .map(
              (spec) =>
                spec.exported.type === "Identifier" && spec.exported.name,
            )
            .filter(Boolean);
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

export function getExports(ast: ParseFileResult) {
  const result: { name: string; dec: t.Node }[] = [];
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      let dec = path.node.declaration;
      result.push({ name: "default", dec });
    },
    ExportNamedDeclaration(path) {
      if (path.node.declaration?.type === "VariableDeclaration") {
        const [dec] = path.node.declaration.declarations;
        const { init } = dec;
        if (dec.id.type === "Identifier" && init) {
          result.push({ name: dec.id.name, dec: init });
        }
      }
    },
  });
  return result;
}

export function getImportSpecs(ast: ParseFileResult) {
  const imports: {
    source: string;
    spec: { imported: string; local: string }[];
  }[] = [];
  traverse(ast, {
    ImportDeclaration(path) {
      imports.push({
        source: path.node.source.value,
        spec: path.node.specifiers
          .map((spec) => {
            if (
              spec.type === "ImportSpecifier" &&
              spec.imported.type === "Identifier"
            ) {
              return { imported: spec.imported.name, local: spec.local.name };
            }
          })
          .filter((v) => !!v),
      });
    },
  });
  return imports;
}
export function getImportLocations<T extends string>(
  ast: ParseFileResult,
  source: string,
  specifiers: T[],
): {
  [K in T]: t.SourceLocation[];
} {
  const imports = getImportSpecs(ast).filter((item) => item.source === source);
  const locations: Record<string, t.SourceLocation[]> = {};
  traverse(ast, {
    Program(programPath) {
      for (const name of specifiers) {
        locations[name] = [];
        let bindingName: string | undefined;
        for (const item of imports) {
          const spec = item.spec.find((spec) => spec.imported === name);
          if (spec) bindingName = spec.local;
        }
        if (!bindingName) continue;
        const binds = programPath.scope.bindings[bindingName];
        for (const path of binds.referencePaths) {
          if (path.node.loc) locations[name]!.push(path.node.loc);
        }
      }
    },
  });
  return locations as any;
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
  program: NodePath<t.Program> & {
    __imports?: Record<string, Record<string, string>>;
  },
  specifiers: T[],
  source: string,
): { [K in T]: string } {
  const cacheKey = [...[...specifiers].sort(), source].join("|");
  if (!program.__imports) program.__imports = {};
  if (program.__imports?.[cacheKey])
    return program.__imports?.[cacheKey] as any;
  const id = specifiers.map((name) => program.scope.generateUid(name));
  program.node.body.unshift(
    t.importDeclaration(
      specifiers.map((spec, index) =>
        t.importSpecifier(t.identifier(id[index]), t.identifier(spec)),
      ),

      t.stringLiteral(source),
    ),
  );
  const result = specifiers.reduce(
    (result, name, index) => {
      result[name] = id[index];
      return result;
    },
    {} as Record<(typeof specifiers)[number], string>,
  );
  program.__imports[cacheKey] = result;
  return result;
}
