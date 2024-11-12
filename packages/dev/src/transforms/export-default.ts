import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function exportDefault(ast: ParseResult<t.File>, name: string) {
  let changes = 0;

  if (
    !ast.program.body.some((node) => node.type === "ExportDefaultDeclaration")
  ) {
    ast.program.body.push(t.exportDefaultDeclaration(t.identifier(name)));
    changes++;
  }

  return changes;
}
