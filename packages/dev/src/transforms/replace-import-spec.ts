import { traverse } from "../utils/babel.js";
import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function replaceImportSpec(
  ast: ParseResult<t.File>,
  options: {
    spec: string[];
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
            options.spec.includes(spec.imported.name)
          ) {
            changes++;
            ast.program.body.unshift(
              t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier(spec.imported.name),
                    t.identifier(spec.imported.name),
                  ),
                ],
                t.stringLiteral(options.newSource),
              ),
            );
            return false;
          }
          return true;
        });
        if (changes) {
          if (!node.specifiers.length) path.remove();
          path.scope.crawl();
        }
      }
    },
  });
  return changes;
}
