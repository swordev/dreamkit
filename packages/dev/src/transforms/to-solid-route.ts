import { addFileChanges, getFirstChain } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function toSolidRoute(ast: ParseResult<t.File>) {
  let changes = 0;
  let routeImportName: string | undefined;

  const routeSpec = "$route";
  const routeSource = "dreamkit/solid";

  traverse(ast, {
    Program(programPath) {
      traverse(programPath.node, {
        ImportDeclaration(importPath) {
          importPath.traverse({
            ImportSpecifier(path) {
              // import { route as ? } from "dreamkit/solid";
              const isRouteImport =
                path.node.imported.type === "Identifier" &&
                path.node.imported.name === routeSpec &&
                importPath.node.source.value === routeSource;

              if (isRouteImport) routeImportName = path.node.local.name;
            },
          });
        },
        ExportDefaultDeclaration(path) {
          const dec = path.node.declaration;
          // [input]
          // import { $route } from "dreamkit";
          // export default route.params({}).create(() => {});
          // [output]
          // import { $route as _$route } from "dreamkit/solid"
          // const selfRoute = _$route.params({});
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
            const selfRoute = programPath.scope.generateUid("selfRoute");
            ast.program.body.splice(
              ast.program.body.indexOf(path.node),
              1,
              // const selfRoute = route.?.?.?
              createSelfRoute(selfRoute, dec.callee.object),
              // export const route = selfRoute.createRouteDefinition();
              createExportRouteDefinition(selfRoute),
              // export default selfRoute.create(() => {})
              createDefaultExportRoute(
                selfRoute,
                dec.arguments[0] as t.Expression,
              ),
            );
          }
        },
        // [input]
        // import { $route } from "dreamkit";
        // export const route = $route.params({}).path('/path');
        // export default function Users() { useRoute(route); }
        // [output]
        // import { $route as _$route } from "dreamkit/solid"
        // const selfRoute = _$route.params({}).path('/path');
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
              // [input]
              // export const route = $route.?;
              // [output]
              // const _selfRoute = $route.?;
              // export const route = _selfRoute.createRouteDefinition();

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
                createSelfRoute(selfRoute, dec.init),
                createExportRouteDefinition(selfRoute),
                ...(exportFunction
                  ? [
                      createDefaultExportRoute(
                        selfRoute,
                        exportFunction.type === "FunctionDeclaration"
                          ? t.functionExpression(
                              exportFunction.id,
                              exportFunction.params,
                              exportFunction.body,
                            )
                          : exportFunction,
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

  return addFileChanges(ast, changes);
}

function createSelfRoute(name: string, route: t.Expression) {
  return t.variableDeclaration("const", [
    t.variableDeclarator(t.identifier(name), route),
  ]);
}

function createExportRouteDefinition(name: string) {
  return t.exportNamedDeclaration(
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("route"),
        t.callExpression(
          t.memberExpression(
            t.identifier(name),
            t.identifier("createRouteDefinition"),
          ),
          [],
        ),
      ),
    ]),
  );
}

function createDefaultExportRoute(name: string, component: t.Expression) {
  return t.exportDefaultDeclaration(
    t.callExpression(
      t.memberExpression(t.identifier(name), t.identifier("create")),
      [component],
    ),
  );
}
