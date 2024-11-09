import { addFileChanges } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function replaceImportSpec(
  ast: ParseResult<t.File>,
  options: {
    spec: string;
    source: string;
    newSource: string;
  },
) {
  let changes = 0;
  traverse(ast, {
    ImportDeclaration(path) {
      const { node } = path;
      if (node.source.value === options.source) {
        node.specifiers = node.specifiers.filter((spec) => {
          if (
            spec.type === "ImportSpecifier" &&
            spec.imported.type === "Identifier" &&
            spec.imported.name === options.spec
          ) {
            changes++;
            ast.program.body.unshift(
              t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier(options.spec),
                    t.identifier(options.spec),
                  ),
                ],
                t.stringLiteral(options.newSource),
              ),
            );
            return false;
          }
          return true;
        });
      }
    },
  });
  return addFileChanges(ast, changes);
}
