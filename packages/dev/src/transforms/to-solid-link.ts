import { addImports, defineTransform } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export const toSolidLink = defineTransform({
  onlyIf: (code) => code.includes("Link"),
  run: (ast) => {
    let changes = 0;
    const addRouterImports = (programPath: NodePath<t.Program>) =>
      addImports(programPath, ["A"], "@solidjs/router");

    let routeImports: ReturnType<typeof addRouterImports> | undefined;
    let linkSpec: string | undefined;
    traverse(ast, {
      Program(programPath) {
        programPath.traverse({
          ImportDeclaration(path) {
            for (const spec of path.node.specifiers) {
              if (
                path.node.source.value === "dreamkit" &&
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier" &&
                spec.imported.name === "Link"
              ) {
                linkSpec = spec.local.name;
              }
            }
          },
          JSXOpeningElement(path) {
            if (
              path.node.name.type === "JSXIdentifier" &&
              path.node.name.name === linkSpec
            ) {
              if (!routeImports)
                routeImports = addImports(
                  programPath,
                  ["A"],
                  "@solidjs/router",
                );

              changes++;
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier("component"),
                  t.jsxExpressionContainer(t.identifier(routeImports.A)),
                ),
              );
            }
          },
        });
      },
    });
    return changes;
  },
});
