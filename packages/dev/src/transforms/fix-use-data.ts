import { ParseFileResult } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import * as t from "@babel/types";

export function fixUseData(ast: ParseFileResult) {
  let routeId: t.Identifier | undefined;
  let transformed = false;
  traverse(ast, {
    ExportNamedDeclaration(path) {
      const dec = path.node.declaration;
      if (dec?.type === "VariableDeclaration") {
        if (dec.declarations[0].id.type === "Identifier") {
          if (dec.declarations[0].id.name === "route") {
            routeId = dec.declarations[0].id;
          }
        }
      }
    },
    ExportDefaultDeclaration(path) {
      const dec = path.node.declaration;
      if (dec.type === "FunctionDeclaration") {
        let propsId: t.Identifier | undefined;
        if (!dec.params.length) {
          propsId = path.scope.generateUidIdentifier("props");
          dec.params.push(propsId);
        } else if (dec.params[0].type === "Identifier") {
          propsId = dec.params[0];
        }
        if (propsId) {
          path.traverse({
            CallExpression(path) {
              const callee = path.node.callee;
              if (
                !path.node.arguments.length &&
                callee.type === "MemberExpression" &&
                callee.object.type === "Identifier" &&
                //callee.object === routeId &&
                callee.property.type === "Identifier" &&
                callee.object.name === "route" &&
                callee.property.name === "useData"
              ) {
                transformed = true;
                path.node.arguments.push(propsId);
              }
            },
          });
        }
      }
    },
  });
  return transformed ? 1 : 0;
}
