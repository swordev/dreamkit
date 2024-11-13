import {
  addImports,
  appendChainCall,
  createConst,
  getFirstChain,
  prependChainCall,
} from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { replaceImportSpec } from "./replace-import-spec.js";
import { ParseResult } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function toSolidRoute(ast: ParseResult<t.File>) {
  let changes = 0;
  let deps: ReturnType<typeof importDeps> | undefined;
  let routeImportName: string | undefined;

  const routeSpec = "$route";
  const routeSource = "dreamkit";
  const routeNewSource = "dreamkit/adapters/solid.js";

  replaceImportSpec(ast, {
    newSource: routeNewSource,
    source: routeSource,
    spec: [routeSpec],
  });

  traverse(ast, {
    Program(programPath) {
      traverse(programPath.node, {
        ImportDeclaration(importPath) {
          importPath.traverse({
            ImportSpecifier(path) {
              // import { route as ? } from "dreamkit/adapters/solid.js";
              const isRouteImport =
                path.node.imported.type === "Identifier" &&
                path.node.imported.name === routeSpec &&
                importPath.node.source.value === routeNewSource;

              if (isRouteImport) routeImportName = path.node.local.name;
            },
          });
        },
        ExportDefaultDeclaration(path) {
          let dec = path.node.declaration;

          if (
            // import { $route } from "dreamkit";
            // const login = $route.create(() => {})
            // export default login
            dec.type === "Identifier"
          ) {
            const bind = programPath.scope.bindings[dec.name];
            if (
              bind &&
              bind.path.node.type === "VariableDeclarator" &&
              bind.path.node.init
            ) {
              dec = bind.path.node.init;
              path.remove();
            }
          }

          // [input]
          // import { $route } from "dreamkit";
          // export default route.params({}).create(() => {});
          // [output]
          // import { $route as _$route } from "dreamkit/adapters/solid.js"
          // import { useLocation, useRouter, useParams} from "@solidjs/router"
          // const selfRoute = _$route.params({}).clone({ deps: ? });
          // export const route = selfRoute.createRouteDefinition();
          // export default delfRoute.create(() => {})
          if (
            // route.?.?.?.create()
            dec.type === "CallExpression" &&
            getFirstChain(dec)?.identifier === routeImportName &&
            dec.callee.type === "MemberExpression" &&
            dec.callee.property.type == "Identifier" &&
            dec.callee.property.name === "create"
          ) {
            changes++;
            if (!deps) deps = importDeps(programPath);
            const selfRoute = programPath.scope.generateUid("selfRoute");
            ast.program.body.splice(
              ast.program.body.indexOf(path.node),
              1,
              // const selfRoute = route.?.?.?
              createConst(
                selfRoute,
                prependChainCall(dec.callee.object, "clone", [
                  createDepsObject(deps),
                ]),
              ),
              // export const route = selfRoute.createRouteDefinition()
              t.exportNamedDeclaration(
                createConst(
                  "route",
                  appendChainCall(selfRoute, "createRouteDefinition", []),
                ),
              ),
              // export default selfRoute.create(() => {})
              t.exportDefaultDeclaration(
                appendChainCall(
                  t.identifier(selfRoute),
                  "create",
                  dec.arguments as t.Expression[],
                ),
              ),
            );
          }
        },
        // [input]
        // import { $route } from "dreamkit";
        // export const route = $route.params({}).path('/path');
        // export default function Users() { useRoute(route); }
        // [output]
        // import { $route as _$route } from "dreamkit/adapters/solid.js"
        // import { useLocation, useRouter, useParams } from "@solidjs/router"
        // const selfRoute = _$route.params({}).path('/path').clone({ deps: ? });
        // export const route = selfRoute.createRouteDefinition();
        // export default selfRoute.create(function Users() { useRoute(selfRoute); });
        ExportNamedDeclaration(path) {
          const node = path.node;
          if (node.declaration?.type === "VariableDeclaration") {
            const [dec] = node.declaration.declarations;
            if (
              dec.id.type === "Identifier" &&
              dec.id.name === "route" &&
              dec.init &&
              getFirstChain(dec.init)?.identifier === routeImportName
            ) {
              changes++;
              // [input]
              // export const route = $route.?;
              // [output]
              // const _selfRoute = $route.?;
              // export const route = _selfRoute.createRouteDefinition();

              if (!deps) deps = importDeps(programPath);

              let exportFunction:
                | t.FunctionDeclaration
                | t.ArrowFunctionExpression
                | undefined;

              const selfRoute = programPath.scope.generateUid("selfRoute");

              const index = ast.program.body.indexOf(path.node);

              // [input]
              // export const route = ?;
              // [output]
              // const _route = ?;
              path.replaceWith(dec);
              path.scope.rename(dec.id.name, selfRoute);

              ast.program.body = ast.program.body.filter((dec) => {
                if (
                  dec.type === "ExportDefaultDeclaration" &&
                  (dec.declaration.type === "FunctionDeclaration" ||
                    dec.declaration.type === "ArrowFunctionExpression")
                ) {
                  exportFunction = dec.declaration;
                  return false;
                }
                return true;
              });

              ast.program.body.splice(
                index,
                1,
                createConst(
                  selfRoute,
                  prependChainCall(dec.init, "clone", [createDepsObject(deps)]),
                ),
                t.exportNamedDeclaration(
                  createConst(
                    "route",
                    appendChainCall(selfRoute, "createRouteDefinition", []),
                  ),
                ),
                ...(exportFunction
                  ? [
                      t.exportDefaultDeclaration(
                        appendChainCall(selfRoute, "create", [
                          exportFunction.type === "FunctionDeclaration"
                            ? t.functionExpression(
                                exportFunction.id,
                                exportFunction.params,
                                exportFunction.body,
                              )
                            : exportFunction,
                        ]),
                      ),
                    ]
                  : []),
              );
            }
          }
        },
      });
    },
  });

  return changes;
}

function createDepsObject(deps: Record<string, string>) {
  return t.objectExpression([
    t.objectProperty(
      t.identifier("deps"),
      t.objectExpression(
        Object.entries(deps).map(([key, value]) =>
          t.objectProperty(t.identifier(key), t.identifier(value)),
        ),
      ),
    ),
  ]);
}

function importDeps(program: NodePath<t.Program>) {
  return addImports(
    program,
    ["useLocation", "useNavigate", "useParams"],
    "@solidjs/router",
  );
}
