import { traverse } from "../utils/babel.js";
import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function replaceImportSpec(
  ast: ParseResult<t.File>,
  options: {
    spec?: string[] | Record<string, string>;
    source: string;
    newSource?: string;
    onRenameSpec?: (prev: string, next: string) => void;
  },
) {
  let changes = 0;
  if (Array.isArray(options.spec) && options.newSource) {
    const specArray = options.spec as string[];
    traverse(ast, {
      ImportDeclaration(path) {
        const { node } = path;
        if (node.source.value === options.source) {
          node.specifiers = node.specifiers.filter((spec) => {
            if (
              spec.type === "ImportSpecifier" &&
              spec.imported.type === "Identifier" &&
              specArray.includes(spec.imported.name)
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
                  t.stringLiteral(options.newSource!),
                ),
              );
              return false;
            }
            return true;
          });
          if (changes) {
            if (!node.specifiers.length) path.remove();
          }
        }
      },
    });
  } else if (options.spec) {
    const specMap = options.spec as Record<string, string>;
    traverse(ast, {
      ImportDeclaration(path) {
        const { node } = path;
        if (node.source.value === options.source) {
          path.traverse({
            ImportSpecifier(spec) {
              if (spec.node.imported.type === "Identifier") {
                const specName = spec.node.imported.name;
                if (specMap[specName]) {
                  const newSpecName = specMap[specName];
                  const newSpecNameAlias = spec.scope.generateUid(newSpecName);
                  options.onRenameSpec?.(specName, newSpecNameAlias);
                  changes++;
                  spec.scope.rename(specName, newSpecNameAlias);
                  spec.node.imported = t.identifier(newSpecName);
                  if (options.newSource) {
                    spec.remove();
                    ast.program.body.unshift(
                      t.importDeclaration(
                        [
                          t.importSpecifier(
                            t.identifier(newSpecNameAlias),
                            t.identifier(newSpecName),
                          ),
                        ],
                        t.stringLiteral(options.newSource),
                      ),
                    );
                  }
                }
              }
            },
          });
          if (changes && !node.specifiers.length) path.remove();
        }
      },
    });
  } else if (options.newSource) {
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === options.source) {
          changes++;
          path.node.source = t.stringLiteral(options.newSource!);
        }
      },
    });
  }
  if (changes)
    traverse(ast, {
      Program(programPath) {
        programPath.scope.crawl();
      },
    });
  return changes;
}
