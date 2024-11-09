import { addFileChanges, getFirstChain } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { ParseResult } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function toSolidRoute(ast: ParseResult<t.File>) {
  let changes = 0;
  let imports: ReturnType<typeof addImports> | undefined;
  let routeImportName: string | undefined;
  // reserved by solid-start
  const reservedExportNames: string[] = ["route"];
  const dkRouteImportSpec = "$route";
  traverse(ast, {
    Program(programPath) {
      traverse(programPath.node, {
        ImportDeclaration(importPath) {
          importPath.traverse({
            ImportSpecifier(path) {
              // import { route as ? } from "dreamkit";
              const isRouteImport =
                path.node.imported.type === "Identifier" &&
                path.node.imported.name === dkRouteImportSpec &&
                importPath.node.source.value === "dreamkit";

              if (isRouteImport) routeImportName = path.node.local.name;

              if (reservedExportNames.includes(path.node.local.name)) {
                // import { route } from "?";
                // import { route as _route } from "?";
                const newName = programPath.scope.generateUid(
                  path.node.local.name,
                );

                if (isRouteImport) routeImportName = newName;

                path.scope.rename(path.node.local.name, newName);
              }
            },
          });
        },
        ExportDefaultDeclaration(path) {
          const dec = path.node.declaration;

          // [input]
          // export default route.params({}).create(() => {});
          // [output]
          // const selfRoute = route.params({});
          // export const route = createSolidRouteConfig(selfRoute);
          // export default = createSolidRoute(selfRoute.create(() => {}), { useLocation, useParams })
          if (
            // route.?.?.?.create()
            dec.type === "CallExpression" &&
            getFirstChain(dec)?.identifier === routeImportName &&
            dec.callee.type === "MemberExpression" &&
            dec.callee.property.type == "Identifier" &&
            dec.callee.property.name === "create"
          ) {
            changes++;
            if (!imports) imports = addImports(ast, programPath);
            const selfRoute = programPath.scope.generateUid("selfRoute");
            ast.program.body.splice(
              ast.program.body.indexOf(path.node),
              1,
              // const selfRoute = route.?.?.?
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.identifier(selfRoute),
                  dec.callee.object,
                ),
              ]),
              // export const route = createSolidRouteConfig(selfRoute)
              t.exportNamedDeclaration(
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.identifier("route"),
                    t.callExpression(
                      t.identifier(imports.createSolidRouteConfig),
                      [t.identifier(selfRoute)],
                    ),
                  ),
                ]),
              ),
              // export default createSolidRoute(selfRoute.create(() => {}), { useLocation, useParams });
              t.exportDefaultDeclaration(
                t.callExpression(t.identifier(imports.createSolidRoute), [
                  t.callExpression(
                    t.memberExpression(
                      t.identifier(selfRoute),
                      t.identifier("create"),
                    ),
                    dec.arguments,
                  ),
                  //t.identifier(selfRoute),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("useLocation"),
                      t.identifier(imports.useLocation),
                    ),
                    t.objectProperty(
                      t.identifier("useParams"),
                      t.identifier(imports.useParams),
                    ),
                  ]),
                ]),
              ),
            );
          } else if (
            // export default myRoute
            dec.type === "Identifier"
          ) {
            changes++;
            if (!imports) imports = addImports(ast, programPath);
            const selfRoute = dec.name;
            ast.program.body.splice(
              ast.program.body.indexOf(path.node),
              1,
              // export const route = createSolidRouteConfig(selfRoute)
              t.exportNamedDeclaration(
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.identifier("route"),
                    t.callExpression(
                      t.identifier(imports.createSolidRouteConfig),
                      [t.identifier(selfRoute)],
                    ),
                  ),
                ]),
              ),
              // export default createSolidRoute(selfRoute, { useLocation, useParams });
              t.exportDefaultDeclaration(
                t.callExpression(t.identifier(imports.createSolidRoute), [
                  t.identifier(selfRoute),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("useLocation"),
                      t.identifier(imports.useLocation),
                    ),
                    t.objectProperty(
                      t.identifier("useParams"),
                      t.identifier(imports.useParams),
                    ),
                  ]),
                ]),
              ),
            );
          }
        },
      });
    },
  });

  return addFileChanges(ast, changes);
}

function addImports(ast: ParseResult<t.File>, program: NodePath<t.Program>) {
  const useLocation = program.scope.generateUid("useLocation");
  const useParams = program.scope.generateUid("useParams");
  const createSolidRoute = program.scope.generateUid("createSolidRoute");
  const createSolidRouteConfig = program.scope.generateUid(
    "createSolidRouteConfig",
  );
  ast.program.body.unshift(
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier(useLocation),
          t.identifier("useLocation"),
        ),
        t.importSpecifier(t.identifier(useParams), t.identifier("useParams")),
      ],
      t.stringLiteral("@solidjs/router"),
    ),
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier(createSolidRoute),
          t.identifier("createSolidRoute"),
        ),
        t.importSpecifier(
          t.identifier(createSolidRouteConfig),
          t.identifier("createSolidRouteConfig"),
        ),
      ],
      t.stringLiteral("dreamkit/adapters/solid.js"),
    ),
  );
  return {
    useLocation,
    useParams,
    createSolidRoute,
    createSolidRouteConfig,
  };
}
