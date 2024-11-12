import { defineTransform } from "../utils/ast.js";
import { replaceImportSpec } from "./replace-import-spec.js";

export const toSolidImport = defineTransform({
  onlyIf: (code) => code.includes("'dreamkit'") || code.includes('"dreamkit"'),
  run: (ast) =>
    replaceImportSpec(ast, {
      source: "dreamkit",
      newSource: "dreamkit/solid",
      spec: [
        "Link",
        "Input",
        "createAction",
        "useRoute",
        "defineLink",
        "LinkComponent",
        "$route",
      ],
    }),
});
