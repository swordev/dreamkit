import { ParseFileResult } from "../utils/ast.js";
import { traverse } from "../utils/babel.js";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

/**
 * @link https://github.com/pcattori/babel-dead-code-elimination
 */
export function deleteDeadCode(ast: ParseFileResult) {
  let removals: number;

  do {
    removals = 0;
    traverse(ast, {
      Program(path) {
        path.scope.crawl();
      },
      ImportDeclaration(path) {
        const removalsBefore = removals;
        for (let specifier of path.get("specifiers")) {
          let local = specifier.get("local");
          if (!isReferenced(local)) {
            specifier.remove();
            removals++;
          }
        }
        if (removals > removalsBefore && path.node.specifiers.length === 0) {
          path.remove();
        }
      },
      VariableDeclarator(path) {
        const id = path.get("id");
        if (id.isIdentifier()) {
          if (!isReferenced(id)) {
            path.remove();
            removals++;
          }
        }
      },
      FunctionDeclaration(path) {
        const id = path.get("id");
        if (id.isIdentifier() && !isReferenced(id)) {
          removals++;
          if (
            t.isAssignmentExpression(path.parentPath.node) ||
            t.isVariableDeclarator(path.parentPath.node)
          ) {
            path.parentPath.remove();
          } else {
            path.remove();
          }
        }
      },
      ClassDeclaration(path) {
        const id = path.get("id");
        if (id.isIdentifier() && !isReferenced(id)) {
          removals++;
          if (
            t.isAssignmentExpression(path.parentPath.node) ||
            t.isVariableDeclarator(path.parentPath.node)
          ) {
            path.parentPath.remove();
          } else {
            path.remove();
          }
        }
      },
    });
  } while (removals > 0);

  return removals;
}

function isReferenced(ident: NodePath<t.Identifier>): boolean {
  let binding = ident.scope.getBinding(ident.node.name);
  if (binding?.referenced) {
    // Functions can reference themselves, so we need to check if there's a
    // binding outside the function scope or not.
    if (binding.path.type === "FunctionDeclaration") {
      return !binding.constantViolations
        .concat(binding.referencePaths)
        // Check that every reference is contained within the function:
        .every((ref) => ref.findParent((parent) => parent === binding?.path));
    }

    return true;
  }
  return false;
}
