import { pickExport } from "../../src/transforms/pick-export.js";
import { toSolidRoute } from "../../src/transforms/to-solid-route.js";
import { parseFile } from "../../src/utils/ast.js";
import { generator } from "../../src/utils/babel.js";
import { describe, it, expect } from "vitest";

describe("pick", () => {
  it("transform default call expression", () => {
    const inCode = `export const a = 1; export const route = 2; export default c;`;
    const ast = parseFile(inCode);
    pickExport(ast, ["route"]);
    const { code } = generator(ast);
    expect(code).toMatchInlineSnapshot(`"export const route = 2;"`);
  });
});
