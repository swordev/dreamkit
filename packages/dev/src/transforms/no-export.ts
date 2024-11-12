import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function noExport(ast: ParseResult<t.File>, names: string[]) {
  let changes = 0;

  for (const node of ast.program.body) {
    if (node.type === "ExportNamedDeclaration") {
      const mainDec = node.declaration;
      if (mainDec && mainDec.type === "VariableDeclaration") {
        const [dec] = mainDec.declarations;

        if (dec.id.type === "Identifier" && names.includes(dec.id.name)) {
          changes++;
          const index = ast.program.body.indexOf(node);
          ast.program.body.splice(
            index,
            1,
            t.variableDeclaration("const", [dec]),
          );
        }
      }
    }
  }

  return changes;
}
