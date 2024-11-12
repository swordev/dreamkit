import { deleteDeadCode } from "./delete-dead-code.js";
import { ParseResult } from "@babel/parser";
import * as t from "@babel/types";

export function pickExport(ast: ParseResult<t.File>, names: string[]) {
  let changes = 0;

  for (const node of ast.program.body) {
    if (node.type === "VariableDeclaration") {
      const [dec, ...decs] = node.declarations;
      if (
        dec &&
        !decs.length &&
        dec.id.type === "Identifier" &&
        names.includes(dec.id.name)
      ) {
        changes++;
        const index = ast.program.body.indexOf(node);
        ast.program.body.splice(
          index,
          1,
          t.exportNamedDeclaration(t.variableDeclaration("const", [dec])),
        );
      }
    }
  }

  ast.program.body = ast.program.body
    .map((stm) => {
      if (stm.type === "ExportNamedDeclaration" && stm.declaration) {
        if (
          stm.declaration.type === "VariableDeclaration" &&
          stm.declaration.declarations.length
        ) {
          const [dec] = stm.declaration.declarations;
          if (dec.id.type === "Identifier" && !names.includes(dec.id.name)) {
            changes++;
            return t.variableDeclaration("const", [dec]);
          }
        } else if (
          stm.declaration.type === "VariableDeclaration" &&
          stm.specifiers.length
        ) {
          const newSpecifiers = stm.specifiers.filter(
            (spec) =>
              spec.exported.type === "Identifier" &&
              !names.includes(spec.exported.name),
          );
          if (newSpecifiers.length !== stm.specifiers.length) {
            changes++;
            stm.specifiers = newSpecifiers;
            if (!newSpecifiers.length) return;
          }
        } else if (
          stm.declaration.type === "FunctionDeclaration" ||
          stm.declaration.type === "ClassDeclaration"
        ) {
          if (
            stm.declaration.id?.type === "Identifier" &&
            !names.includes(stm.declaration.id.name)
          ) {
            changes++;
            return stm.declaration;
          }
        }
      } else if (
        stm.type === "ExportDefaultDeclaration" &&
        !names.includes("default")
      ) {
        changes++;
        return;
      }

      return stm;
    })
    .filter((v) => v !== undefined);

  return changes + deleteDeadCode(ast);
}
